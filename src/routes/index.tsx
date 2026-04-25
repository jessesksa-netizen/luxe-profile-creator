import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Splash } from "@/components/site/Splash";
import { ProfileView } from "@/components/site/ProfileView";
import { useOwnerProfile } from "@/lib/use-profile";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { profile, links, badges, loading } = useOwnerProfile();
  const [entered, setEntered] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/50" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold holo-text">no profile yet</h1>
          <p className="mt-3 text-sm text-foreground/70">sign in via discord to set up your profile.</p>
          <a href="/login" className="inline-block mt-5 px-5 py-2.5 rounded-lg holo-bg text-sm font-medium text-black">login</a>
        </div>
      </div>
    );
  }

  return (
    <>
      {!entered && <Splash onEnter={() => setEntered(true)} accent={profile.accent_color} audioSrc={profile.audio_url} />}
      <ProfileView profile={profile} links={links} badges={badges} />
    </>
  );
}
