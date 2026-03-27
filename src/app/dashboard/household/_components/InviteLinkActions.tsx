"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type InviteLinkActionsProps = {
  invitePath: string;
};

export function InviteLinkActions({
  invitePath,
}: InviteLinkActionsProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState(invitePath);
  const canShare =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";

  // Build the full URL in the browser so each device uses the origin it actually opened.
  useEffect(() => {
    setInviteUrl(`${window.location.origin}${invitePath}`);
  }, [invitePath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setStatusMessage("Invite link copied.");
    } catch {
      setStatusMessage("Couldn't copy the link. You can still copy it manually below.");
    }
  };

  const handleShare = async () => {
    if (!canShare) return;

    try {
      await navigator.share({
        title: "LifeHub workspace invite",
        text: "Join my LifeHub workspace.",
        url: inviteUrl,
      });
      setStatusMessage(null);
    } catch {
      // Ignore canceled shares and leave the manual fallback in place.
    }
  };

  return (
    <div className="grid gap-3">
      <input
        readOnly
        value={inviteUrl}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black"
        aria-label="Invite link"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={handleCopy}>
          Copy link
        </Button>
        {canShare ? (
          <Button type="button" variant="outline" onClick={handleShare}>
            Share
          </Button>
        ) : null}
      </div>
      {statusMessage ? (
        <p className="text-sm text-gray-700">{statusMessage}</p>
      ) : null}
    </div>
  );
}
