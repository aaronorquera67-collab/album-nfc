"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DEFAULT_ALBUM_EMOJI,
  isValidAlbumEmoji,
} from "@/lib/album-emojis";
import { countryNameFromCode } from "@/lib/countries";
import { randomSuffix, slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/storage";

export type CreateAlbumState = {
  error: string | null;
};

type CreatedAlbum = {
  id: string;
  slug: string;
};

type AlbumMediaPath = {
  storage_path: string;
};

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return supabase;
}

export async function createAlbum(
  _prevState: CreateAlbumState,
  formData: FormData,
): Promise<CreateAlbumState> {
  const supabase = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();

  const countryCode = String(
    formData.get("country_code") ?? "",
  ).trim();

  const emojiInput = String(
    formData.get("emoji") ?? "",
  ).trim();

  if (!name) {
    return {
      error: "Ponle un nombre al álbum.",
    };
  }

  if (!countryCode) {
    return {
      error: "Elige un país.",
    };
  }

  if (!emojiInput) {
    return {
      error: "Elige un emoji para el álbum.",
    };
  }

  const emoji = isValidAlbumEmoji(emojiInput)
    ? emojiInput
    : DEFAULT_ALBUM_EMOJI;

  const countryName = countryNameFromCode(countryCode);

  const baseSlug =
    slugify(name) ||
    slugify(countryName) ||
    "album";

  let slug = baseSlug;
  let attempt = 0;
  let insertedSlug: string | null = null;
  let albumId: string | null = null;

  while (attempt < 5 && !insertedSlug) {
    const { data, error } = await supabase
      .rpc("create_album_for_app", {
        p_name: name,
        p_emoji: emoji,
        p_country_code: countryCode,
        p_country_name: countryName,
        p_slug: slug,
      })
      .single();

    const createdAlbum =
      data as CreatedAlbum | null;

    if (!error && createdAlbum) {
      insertedSlug = createdAlbum.slug;
      albumId = createdAlbum.id;
      break;
    }

    if (error?.code === "23505") {
      attempt += 1;
      slug = `${baseSlug}-${randomSuffix()}`;
      continue;
    }

    return {
      error: `Error Supabase: ${
        error?.message ?? "desconocido"
      } | código: ${
        error?.code ?? "desconocido"
      }`,
    };
  }

  if (!insertedSlug || !albumId) {
    return {
      error:
        "No se pudo crear el álbum. Inténtalo de nuevo.",
    };
  }

  // Crear el código único del sticker NFC.
  let stickerCreated = false;

  for (
    let attempt = 0;
    attempt < 5;
    attempt += 1
  ) {
    const code =
      randomBytes(12).toString("hex");

    const { error } = await supabase.rpc(
      "create_sticker_for_album",
      {
        p_album_id: albumId,
        p_code: code,
      },
    );

    if (!error) {
      stickerCreated = true;

      revalidatePath("/app");

      redirect(`/s/${code}`);
    }

    if (error.code !== "23505") {
      break;
    }
  }

  if (!stickerCreated) {
    return {
      error:
        "No se pudo crear el sticker NFC. Inténtalo de nuevo.",
    };
  }

  return {
    error: "No se pudo crear el álbum.",
  };
}

export async function deleteAlbum(
  albumId: string,
  slug: string,
) {
  const supabase = await requireAdmin();

  const { data: mediaRows } =
    await supabase.rpc(
      "get_media_by_album_for_app",
      {
        p_album_id: albumId,
      },
    );

  const paths =
    (mediaRows ?? []) as AlbumMediaPath[];

  if (paths.length > 0) {
    const { error: storageError } =
      await supabase.storage
        .from(MEDIA_BUCKET)
        .remove(
          paths.map(
            (m) => m.storage_path,
          ),
        );

    if (storageError) {
      throw new Error(
        `No se pudieron eliminar las fotos: ${storageError.message}`,
      );
    }
  }

  const { error } =
    await supabase.rpc(
      "delete_album_for_app",
      {
        p_album_id: albumId,
      },
    );

  if (error) {
    throw new Error(
      `No se pudo eliminar el álbum: ${error.message}`,
    );
  }

  revalidatePath("/app");
  revalidatePath(`/album/${slug}`);

  redirect("/app");
}