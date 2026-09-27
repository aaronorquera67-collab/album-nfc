import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumWelcome } from "@/components/album-welcome";
import { BrandLockup } from "@/components/brand-lockup";
import { PhotoGrid } from "@/components/photo-grid";
import { UploadButton } from "@/components/upload-button";
import { getAlbumBySticker } from "@/lib/albums";
import { createClient } from "@/lib/supabase/server";

const MAX_PHOTOS = 20;

export default async function StickerAlbumPage(
  props: PageProps<"/s/[code]">,
) {
  const { code } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = !!user;

  const result = await getAlbumBySticker(code);

  if (!result) {
    notFound();
  }

  const { album, media } = result;

  const photoCount = media.length;

  console.log(
    "CONTADOR:",
    photoCount,
    "MAX:",
    MAX_PHOTOS,
  );

  const albumFull = photoCount >= MAX_PHOTOS;

  return (
    <>
      <AlbumWelcome
        slug={album.slug}
        name={album.name}
        emoji={album.emoji}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:gap-8 sm:px-8 sm:pt-16">
        
        {/* CABECERA DEL ÁLBUM */}
        <div
          className="relative overflow-hidden rounded-[2rem] border border-surface-border bg-arena shadow-sm"
          style={
            album.cover_url
              ? {
                  backgroundImage: `url("${album.cover_url}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Capa sobre la foto */}
          {album.cover_url ? (
            <div className="absolute inset-0 bg-piedra/55 backdrop-blur-[1px]" />
          ) : null}

          <div className="relative z-10 flex min-h-[230px] flex-col justify-between p-5 sm:min-h-[270px] sm:p-7">
            
            {/* Parte superior */}
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-blanco/90 px-3 py-2 shadow-sm backdrop-blur-sm">
                <BrandLockup
                  size="sm"
                  href="/"
                  className="inline-flex"
                />
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <p className="rounded-full bg-blanco/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-bosque shadow-sm backdrop-blur-sm">
                  Álbum privado
                </p>

                <Link
                  href="/login"
                  className="text-[11px] font-medium text-blanco/90 transition hover:text-blanco"
                >
                  Administración
                </Link>
              </div>
            </div>

            {/* Información del álbum */}
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blanco drop-shadow-md">
                {album.emoji} {album.country_name}
              </p>

              <h1 className="mt-2 break-words text-[clamp(2rem,7vw,4rem)] font-bold leading-none text-blanco drop-shadow-lg">
                {album.name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blanco/90 px-3 py-1.5 text-xs font-semibold text-tierra shadow-sm backdrop-blur-sm">
                  ❤️ {photoCount} / {MAX_PHOTOS} recuerdos
                </span>

                {albumFull ? (
                  <span className="rounded-full bg-blanco/90 px-3 py-1.5 text-xs font-semibold text-bosque shadow-sm backdrop-blur-sm">
                    🔒 Álbum completo
                  </span>
                ) : null}
              </div>

              {!albumFull && photoCount >= 17 ? (
                <p className="mt-2 text-xs font-medium text-blanco drop-shadow-md">
                  Te quedan{" "}
                  {MAX_PHOTOS - photoCount}{" "}
                  recuerdos por guardar.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* FOTOS */}
        <PhotoGrid
          media={media}
          albumId={album.id}
          slug={album.slug}
          coverPath={album.cover_path}
          isAdmin={isAdmin}
        />

        {/* BOTÓN PARA AGREGAR */}
        <UploadButton
          albumId={album.id}
          slug={album.slug}
          stickerCode={code}
          photoCount={photoCount}
          maxPhotos={MAX_PHOTOS}
        />
      </main>
    </>
  );
}