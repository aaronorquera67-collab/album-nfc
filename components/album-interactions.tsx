"use client";

import { useState } from "react";
import { SpotifyPlayer } from "@/components/spotify-player";
import { UploadButton } from "@/components/upload-button";

type AlbumInteractionsProps = {
  spotifyUrl: string | null;
  albumId: string;
  slug: string;
  stickerCode: string;
  photoCount: number;
  maxPhotos: number;
};

export function AlbumInteractions({
  spotifyUrl,
  albumId,
  slug,
  stickerCode,
  photoCount,
  maxPhotos,
}: AlbumInteractionsProps) {
  const [spotifyActive, setSpotifyActive] =
    useState(false);

  function activateSpotify() {
    setSpotifyActive(true);
  }

  return (
    <>
      <SpotifyPlayer
        spotifyUrl={spotifyUrl}
        active={spotifyActive}
        onActivate={activateSpotify}
      />

      <UploadButton
        albumId={albumId}
        slug={slug}
        stickerCode={stickerCode}
        photoCount={photoCount}
        maxPhotos={maxPhotos}
        onOpen={activateSpotify}
      />
    </>
  );
}