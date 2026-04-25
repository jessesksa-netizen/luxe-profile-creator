import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "owner@profile.local";
const SUB_DOMAIN = "profile.local";

function emailForSlug(slug: string) {
  return `${slug.toLowerCase()}@${SUB_DOMAIN}`;
}

function admin() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function anon() {
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function assertOwner(password: string) {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) throw new Error("Owner password not configured");
  if (password !== expected) throw new Error("Incorrect owner password");
}

export const ownerLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => {
    if (typeof input?.password !== "string" || input.password.length < 1 || input.password.length > 256) {
      throw new Error("Invalid password");
    }
    return input;
  })
  .handler(async ({ data }) => {
    await assertOwner(data.password);
    const a = admin();

    // Ensure owner user exists with current password
    const { data: list } = await a.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === OWNER_EMAIL);
    if (!existing) {
      await a.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: data.password,
        email_confirm: true,
      });
    } else {
      // Keep auth password in sync with the secret
      await a.auth.admin.updateUserById(existing.id, { password: data.password });
    }

    // Sign in with anon client to get a real session
    const { data: signInData, error } = await anon().auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: data.password,
    });
    if (error || !signInData.session) throw new Error(error?.message || "Login failed");

    // Ensure a profile row exists for this owner user, migrating any legacy single-tenant row
    const ownerId = signInData.session.user.id;
    const { data: own } = await a.from("profiles").select("id").eq("id", ownerId).maybeSingle();
    if (!own) {
      const { data: legacy } = await a.from("profiles").select("id").neq("id", ownerId).limit(1).maybeSingle();
      if (legacy) {
        // Re-point legacy profile + its links/badges to the owner auth uid
        await a.from("profile_links").update({ user_id: ownerId }).eq("user_id", legacy.id);
        await a.from("profile_badges").update({ user_id: ownerId }).eq("user_id", legacy.id);
        await a.from("profiles").update({ id: ownerId }).eq("id", legacy.id);
      } else {
        await a.from("profiles").insert({ id: ownerId, username: "user" });
      }
    }
    // Always mark this account as the owner
    await a.from("profiles").update({ is_owner: true }).eq("id", ownerId);

    return {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    };
  });

// ---- Sub-user login (slug + password) ----
export const userLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string; password: string }) => {
    if (typeof input?.slug !== "string" || !/^[a-zA-Z0-9_-]{1,40}$/.test(input.slug)) {
      throw new Error("Invalid username");
    }
    if (typeof input?.password !== "string" || input.password.length < 1 || input.password.length > 256) {
      throw new Error("Invalid password");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const email = emailForSlug(data.slug);
    const { data: signInData, error } = await anon().auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (error || !signInData.session) throw new Error("Incorrect username or password");
    return {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    };
  });

// ---- Owner-only: list managed users ----
export const ownerListUsers = createServerFn({ method: "POST" })
  .inputValidator((input: { ownerPassword: string }) => input)
  .handler(async ({ data }) => {
    await assertOwner(data.ownerPassword);
    const a = admin();
    const { data: profiles, error } = await a
      .from("profiles")
      .select("id, slug, username, display_name, is_owner, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { users: profiles ?? [] };
  });

// ---- Owner-only: create new user account ----
export const ownerCreateUser = createServerFn({ method: "POST" })
  .inputValidator((input: { ownerPassword: string; slug: string; password: string }) => {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(input.slug)) throw new Error("slug must be 1-40 chars: letters, numbers, _ or -");
    if (typeof input.password !== "string" || input.password.length < 4 || input.password.length > 256) {
      throw new Error("password must be at least 4 characters");
    }
    return input;
  })
  .handler(async ({ data }) => {
    await assertOwner(data.ownerPassword);
    const a = admin();
    // Reject if slug exists
    const { data: existingSlug } = await a.from("profiles").select("id").ilike("slug", data.slug).maybeSingle();
    if (existingSlug) throw new Error("slug already taken");

    const email = emailForSlug(data.slug);
    const { data: created, error: cErr } = await a.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (cErr || !created.user) throw new Error(cErr?.message || "could not create user");

    const newId = created.user.id;
    // Trigger may have inserted a profile already; upsert slug/username
    const { error: pErr } = await a.from("profiles").upsert({
      id: newId,
      username: data.slug,
      slug: data.slug,
      is_owner: false,
    }, { onConflict: "id" });
    if (pErr) throw new Error(pErr.message);
    return { id: newId, slug: data.slug };
  });

// ---- Owner-only: change a sub-user's password ----
export const ownerSetUserPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { ownerPassword: string; userId: string; password: string }) => {
    if (typeof input.userId !== "string" || input.userId.length < 8) throw new Error("invalid user id");
    if (typeof input.password !== "string" || input.password.length < 4) throw new Error("password must be at least 4 chars");
    return input;
  })
  .handler(async ({ data }) => {
    await assertOwner(data.ownerPassword);
    const a = admin();
    const { error } = await a.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Owner-only: delete a sub-user ----
export const ownerDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((input: { ownerPassword: string; userId: string }) => input)
  .handler(async ({ data }) => {
    await assertOwner(data.ownerPassword);
    const a = admin();
    // Safety: never delete the owner profile
    const { data: prof } = await a.from("profiles").select("is_owner").eq("id", data.userId).maybeSingle();
    if (prof?.is_owner) throw new Error("cannot delete owner");
    await a.from("profile_links").delete().eq("user_id", data.userId);
    await a.from("profile_badges").delete().eq("user_id", data.userId);
    await a.from("profiles").delete().eq("id", data.userId);
    const { error } = await a.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
