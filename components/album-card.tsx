"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { AlbumWithCount } from "@/lib/types";

export function AlbumCard({ album }: { album: AlbumWithCount }) {
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generateNfcLink() {
    const link = `${window.location.origin}/s/${album.sticker_code}`;

    setGeneratedLink(link);
    setCopied(false);
  }

  async function copyNfcLink() {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        show: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link
        href={`/s/${album.sticker_code}`}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm shadow-piedra/10 transition-transform duration-150 hover:border-tierra/50 hover:shadow-tierra/15 active:scale-[0.98] sm:rounded-3xl"
      >
        {album.cover_url ? (
          <Image
            src={album.cover_url}
            alt={album.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-tierra/15 via-arena to-bosque/15 text-5xl transition-transform duration-500 ease-out group-hover:scale-110 sm:text-6xl">
            {album.emoji}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-piedra/85 via-piedra/15 to-transparent transition-opacity duration-300 group-hover:from-piedra/90" />

        {album.cover_url ? (
          <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-blanco/85 text-base backdrop-blur-sm sm:right-3 sm:top-3 sm:h-9 sm:w-9 sm:text-lg">
            {album.emoji}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-blanco sm:text-base md:text-xl">
            {album.name}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-blanco/75 sm:text-sm">
            {album.country_name} · {album.media_count}{" "}
            {album.media_count === 1 ? "foto" : "fotos"}
          </p>
        </div>
      </Link>

      <div className="mt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={generateNfcLink}
          disabled={!album.sticker_code}
          className="inline-flex min-h-[42px] w-full items-center justify-center rounded-full border border-tierra bg-tierra/10 px-4 text-sm font-semibold text-tierra transition hover:bg-tierra/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          🔗 Generar link NFC
        </button>

        {generatedLink ? (
          <div className="rounded-xl border border-surface-border bg-surface p-2">
            <p className="break-all text-[11px] leading-relaxed text-muted-foreground">
              {generatedLink}
            </p>

            <button
              type="button"
              onClick={copyNfcLink}
              className="mt-2 inline-flex min-h-[38px] w-full items-center justify-center rounded-full bg-tierra px-4 text-xs font-semibold text-blanco transition hover:opacity-90 active:scale-[0.98]"
            >
              {copied ? "✓ Link copiado" : "Copiar link"}
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}