import { createClient } from "@/lib/supabase/server";
import type { Album, AlbumWithCount, Media } from "@/lib/types";

const SIGNED_URL_SECONDS = 60 * 60;

async function addSignedUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media: Media[],
): Promise<Media[]> {
  return Promise.all(
    media.map(async (item) => {
      const { data } = await supabase.storage
        .from("media")
        .createSignedUrl(
          item.storage_path,
          SIGNED_URL_SECONDS,
        );

      return {
        ...item,
        signed_url: data?.signedUrl ?? null,
      };
    }),
  );
}

async function addSignedCoverUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  album: Album,
): Promise<Album> {
  if (!album.cover_path) {
    return {
      ...album,
      cover_url: null,
    };
  }

  const { data } = await supabase.storage
    .from("media")
    .createSignedUrl(
      album.cover_path,
      SIGNED_URL_SECONDS,
    );

  return {
    ...album,
    cover_url: data?.signedUrl ?? null,
  };
}

export async function getAlbums(): Promise<AlbumWithCount[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "get_all_albums_for_app",
    );

    if (error || !data) {
      return [];
    }

    const rows = data as Album[];

    const albums = await Promise.all(
      rows.map(async (row: Album) => {
        const album = row;

        const { data: stickerCode } = await supabase.rpc(
          "get_sticker_code_by_album",
          {
            p_album_id: album.id,
          },
        );

        let mediaCount = 0;

        if (stickerCode) {
          const { data: mediaData } = await supabase.rpc(
            "get_media_by_sticker",
            {
              p_code: stickerCode,
            },
          );

          mediaCount = mediaData?.length ?? 0;
        }

        const albumWithCover = await addSignedCoverUrl(
          supabase,
          album,
        );

        return {
          ...albumWithCover,
          media_count: mediaCount,
          sticker_code: stickerCode ?? "",
        };
      }),
    );

    return albums;
  } catch {
    return [];
  }
}

export async function getAlbumBySlug(slug: string) {
  try {
    const supabase = await createClient();

    const { data: albumData, error } = await supabase
      .from("albums")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !albumData) {
      return null;
    }

    const album = albumData as Album;

    const { data: mediaData } = await supabase
      .from("media")
      .select("*")
      .eq("album_id", album.id)
      .order("created_at", { ascending: false });

    const media = (mediaData ?? []).map((item) => ({
      ...(item as Media),
      signed_url: null,
    }));

    const signedMedia = await addSignedUrls(
      supabase,
      media,
    );

    const albumWithCover = await addSignedCoverUrl(
      supabase,
      album,
    );

    return {
      album: albumWithCover,
      media: signedMedia,
    };
  } catch {
    return null;
  }
}

export async function getAlbumBySticker(code: string) {
  try {
    const supabase = await createClient();

    const { data: albumData, error } = await supabase
      .rpc("get_album_by_sticker", {
        p_code: code,
      })
      .maybeSingle();

    if (error || !albumData) {
      return null;
    }

    const album = albumData as Album;

    const { data: mediaData, error: mediaError } =
      await supabase.rpc("get_media_by_sticker", {
        p_code: code,
      });

    if (mediaError) {
      return null;
    }

    const media = (mediaData ?? []).map(
      (item: unknown) => ({
        ...(item as Media),
        signed_url: null,
      }),
    );

    const signedMedia = await addSignedUrls(
      supabase,
      media,
    );

    const albumWithCover = await addSignedCoverUrl(
      supabase,
      album,
    );

    return {
      album: albumWithCover,
      media: signedMedia,
    };
  } catch {
    return null;
  }
}