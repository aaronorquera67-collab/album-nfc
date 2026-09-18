import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumWelcome } from "@/components/album-welcome";
import { BrandLockup } from "@/components/brand-lockup";
import { PhotoGrid } from "@/components/photo-grid";
import { UploadButton } from "@/components/upload-button";
import { getAlbumBySticker } from "@/lib/albums";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <>
      <AlbumWelcome
        slug={album.slug}
        name={album.name}
        emoji={album.emoji}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] sm:gap-8 sm:px-8 sm:pt-16">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex items-center justify-between gap-3">
            <BrandLockup
              size="sm"
              href="/"
              className="inline-flex"
            />

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bosque">
              Álbum privado
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bosque">
              {album.emoji} {album.country_name}
            </p>

            <h1 className="mt-2 break-words text-[clamp(1.5rem,6vw,3rem)] font-semibold leading-tight text-foreground">
              {album.name}
            </h1>
          </div>
        </div>

        <PhotoGrid
          media={media}
          albumId={album.id}
          slug={album.slug}
          coverPath={album.cover_path}
          isAdmin={isAdmin}
        />

        <UploadButton
          albumId={album.id}
          slug={album.slug}
          stickerCode={code}
        />

        <footer className="pb-6 pt-2 text-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground/60 transition hover:text-tierra"
          >
            Administración
          </Link>
        </footer>
      </main>
    </>
  );
}