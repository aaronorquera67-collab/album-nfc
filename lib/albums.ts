import { createClient } from "@/lib/supabase/server";
import type { Album, AlbumWithCount, Media } from "@/lib/types";

const SIGNED_URL_SECONDS = 60 * 60;

async function addSignedUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media: Media[],
): Promise<Media[]> {
  return Promise.all(
    media.map(async (item) => {
      const { data, error } = await supabase.storage
        .from("media")
        .createSignedUrl(
          item.storage_path,
          SIGNED_URL_SECONDS,
        );

      if (error) {
        console.error(
          "ERROR createSignedUrl:",
          item.storage_path,
          error,
        );
      }

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

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUrl(
      album.cover_path,
      SIGNED_URL_SECONDS,
    );

  if (error) {
    console.error(
      "ERROR createSignedCoverUrl:",
      album.cover_path,
      error,
    );
  }

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
      console.error(
        "ERROR get_all_albums_for_app:",
        error,
      );
      return [];
    }

    const rows = data as Album[];

    const albums = await Promise.all(
      rows.map(async (row: Album) => {
        const album = row;

        const { data: stickerCode, error: stickerError } =
          await supabase.rpc(
            "get_sticker_code_by_album",
            {
              p_album_id: album.id,
            },
          );

        if (stickerError) {
          console.error(
            "ERROR get_sticker_code_by_album:",
            stickerError,
          );
        }

        let mediaCount = 0;

        if (stickerCode) {
          const {
            data: mediaData,
            error: mediaError,
          } = await supabase.rpc(
            "get_media_by_sticker",
            {
              p_code: stickerCode,
            },
          );

          if (mediaError) {
            console.error(
              "ERROR get_media_by_sticker:",
              mediaError,
            );
          }

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
  } catch (error) {
    console.error("ERROR getAlbums:", error);
    return [];
  }
}

export async function getAlbumBySlug(slug: string) {
  try {
    const supabase = await createClient();

    const {
      data: albumData,
      error,
    } = await supabase
      .from("albums")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !albumData) {
      console.error(
        "ERROR getAlbumBySlug album:",
        error,
      );
      return null;
    }

    const album = albumData as Album;

    const { data: mediaData, error: mediaError } =
      await supabase
        .from("media")
        .select("*")
        .eq("album_id", album.id)
        .order("created_at", {
          ascending: false,
        });

    if (mediaError) {
      console.error(
        "ERROR getAlbumBySlug media:",
        mediaError,
      );
    }

    const media = (mediaData ?? []).map((item) => ({
      ...(item as Media),
      signed_url: null,
    }));

    const signedMedia = await addSignedUrls(
      supabase,
      media,
    );

    const albumWithCover =
      await addSignedCoverUrl(
        supabase,
        album,
      );

    return {
      album: albumWithCover,
      media: signedMedia,
    };
  } catch (error) {
    console.error(
      "ERROR getAlbumBySlug:",
      error,
    );
    return null;
  }
}

export async function getAlbumBySticker(
  code: string,
) {
  try {
    const supabase = await createClient();

    console.log(
      "BUSCANDO STICKER:",
      code,
    );

    const {
      data: albumData,
      error: albumError,
    } = await supabase
      .rpc("get_album_by_sticker", {
        p_code: code,
      })
      .maybeSingle();

    console.log(
      "RESULTADO ALBUM:",
      albumData,
    );

    if (albumError) {
      console.error(
        "ERROR get_album_by_sticker:",
        albumError,
      );
      return null;
    }

    if (!albumData) {
      console.error(
        "NO SE ENCONTRO EL ALBUM PARA EL STICKER:",
        code,
      );
      return null;
    }

    const album = albumData as Album;

    const {
      data: mediaData,
      error: mediaError,
    } = await supabase.rpc(
      "get_media_by_sticker",
      {
        p_code: code,
      },
    );

    console.log(
      "RESULTADO MEDIA:",
      mediaData,
    );

    if (mediaError) {
      console.error(
        "ERROR get_media_by_sticker:",
        mediaError,
      );
      return null;
    }

    const media = (mediaData ?? []).map(
      (item: unknown) => ({
        ...(item as Media),
        signed_url: null,
      }),
    );

    const signedMedia =
      await addSignedUrls(
        supabase,
        media,
      );

    const albumWithCover =
      await addSignedCoverUrl(
        supabase,
        album,
      );

    return {
      album: albumWithCover,
      media: signedMedia,
    };
  } catch (error) {
    console.error(
      "ERROR getAlbumBySticker:",
      error,
    );
    return null;
  }
}