import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "owner@profile.local";

export const ownerLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => {
    if (typeof input?.password !== "string" || input.password.length < 1 || input.password.length > 256) {
      throw new Error("Invalid password");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const expected = process.env.OWNER_PASSWORD;
    if (!expected) throw new Error("Owner password not configured");
    if (data.password !== expected) throw new Error("Incorrect password");

    const url = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY!;

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Ensure owner user exists with current password
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === OWNER_EMAIL);
    if (!existing) {
      await admin.auth.admin.createUser({
        email: OWNER_EMAIL,
        password: data.password,
        email_confirm: true,
      });
    } else {
      // Keep auth password in sync with the secret
      await admin.auth.admin.updateUserById(existing.id, { password: data.password });
    }

    // Sign in with anon client to get a real session
    const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signInData, error } = await anon.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: data.password,
    });
    if (error || !signInData.session) throw new Error(error?.message || "Login failed");

    // Ensure a profile row exists for this owner user, migrating any legacy single-tenant row
    const ownerId = signInData.session.user.id;
    const { data: own } = await admin.from("profiles").select("id").eq("id", ownerId).maybeSingle();
    if (!own) {
      const { data: legacy } = await admin.from("profiles").select("id").neq("id", ownerId).limit(1).maybeSingle();
      if (legacy) {
        // Re-point legacy profile + its links/badges to the owner auth uid
        await admin.from("profile_links").update({ user_id: ownerId }).eq("user_id", legacy.id);
        await admin.from("profile_badges").update({ user_id: ownerId }).eq("user_id", legacy.id);
        await admin.from("profiles").update({ id: ownerId }).eq("id", legacy.id);
      } else {
        await admin.from("profiles").insert({ id: ownerId, username: "user" });
      }
    }

    return {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    };
  });
