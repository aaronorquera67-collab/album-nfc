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

  if (expanded) {
    return (
      <div className="absolute bottom-4 left-3 right-3 z-[50] overflow-hidden rounded-2xl border border-white/20 bg-[#121212] shadow-2xl sm:left-auto sm:right-5 sm:w-[360px]">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
            🎵 Canción del recuerdo
          </p>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm text-white"
            aria-label="Cerrar reproductor"
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
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        onActivate();
        setExpanded(true);
      }}
      aria-label="Abrir Spotify"
      className="absolute bottom-4 right-4 z-[50] flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white bg-[#121212] shadow-2xl transition-transform active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:p-1.5 sm:pr-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
        <span className="ml-1 text-base text-black">
          ▶
        </span>
      </div>

      <div className="hidden min-w-0 text-left sm:block">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50">
          Canción
        </p>

        <p className="max-w-[120px] truncate text-xs font-semibold text-white">
          Escuchar en Spotify
        </p>
      </div>
    </button>
  );
}