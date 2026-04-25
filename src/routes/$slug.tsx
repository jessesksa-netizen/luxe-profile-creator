import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Splash } from "@/components/site/Splash";
import { ProfileView } from "@/components/site/ProfileView";
import { useProfileBySlug } from "@/lib/use-profile";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/$slug")({
  component: SlugPage,
});

function SlugPage() {
  const { slug } = Route.useParams();
  const { profile, links, badges, loading, notFound } = useProfileBySlug(slug);
  const [entered, setEntered] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold holo-text">profile not found</h1>
          <p className="mt-3 text-sm text-foreground/70">no one lives at /{slug}</p>
          <Link to="/" className="inline-block mt-5 px-5 py-2.5 rounded-lg holo-bg text-sm font-medium text-black">go home</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {!entered && (
        <Splash
          onEnter={() => setEntered(true)}
          accent={profile.accent_color}
          backgroundUrl={profile.background_url}
          backgroundType={(profile as unknown as { background_type?: string }).background_type}
          backgroundBlur={profile.background_blur}
          username={profile.username}
        />
      )}
      <ProfileView profile={profile} links={links} badges={badges} autoPlayAudio={entered} />
    </>
  );
}