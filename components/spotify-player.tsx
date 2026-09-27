"use client";

import { useState } from "react";

type SpotifyPlayerProps = {
  spotifyUrl: string | null;
  active: boolean;
  onActivate: () => void;
};

function getSpotifyEmbedUrl(
  spotifyUrl: string,
): string | null {
  try {
    const url = new URL(spotifyUrl);

    if (
      url.hostname !== "open.spotify.com" &&
      url.hostname !== "www.open.spotify.com"
    ) {
      return null;
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    const trackIndex = parts.indexOf("track");

    if (trackIndex === -1) {
      return null;
    }

    const id = parts[trackIndex + 1];

    if (!id) {
      return null;
    }

    return `https://open.spotify.com/embed/track/${id}?utm_source=generator`;
  } catch {
    return null;
  }
}

export function SpotifyPlayer({
  spotifyUrl,
  active,
  onActivate,
}: SpotifyPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!spotifyUrl) {
    return null;
  }

  const embedUrl = getSpotifyEmbedUrl(spotifyUrl);

  if (!embedUrl) {
    return null;
  }

  function openPlayer() {
    onActivate();
    setExpanded(true);
  }

  function closePlayer() {
    setExpanded(false);
  }

  return (
    <>
      {/* MINI REPRODUCTOR */}
      {expanded ? (
        <div className="absolute bottom-4 right-4 z-[50] w-[calc(100%-2rem)] max-w-[340px] overflow-hidden rounded-2xl border border-white/15 bg-[#121212] shadow-2xl sm:bottom-5 sm:right-5 sm:w-[340px]">
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1DB954]">
                <span className="text-sm font-bold text-black">
                  ♪
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  Canción del recuerdo
                </p>

                <p className="truncate text-xs font-semibold text-white">
                  Spotify
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closePlayer}
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white transition hover:bg-white/20"
              aria-label="Cerrar Spotify"
            >
              ✕
            </button>
          </div>

          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="eager"
            title="Canción del recuerdo"
            className="block w-full"
          />
        </div>
      ) : (
        /* BOTÓN CIRCULAR */
        <button
          type="button"
          onClick={openPlayer}
          aria-label="Abrir canción de Spotify"
          className="absolute bottom-4 right-4 z-[50] flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] shadow-xl ring-2 ring-white/80 transition-all duration-200 hover:scale-105 active:scale-90 sm:bottom-5 sm:right-5 sm:h-16 sm:w-16"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954] shadow-md sm:h-11 sm:w-11">
            <span className="ml-0.5 text-lg font-bold text-black">
              ▶
            </span>
          </div>
        </button>
      )}
    </>
  );
}