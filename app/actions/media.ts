"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/storage";

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

export async function registerMedia(
  albumId: string,
  slug: string,
  storagePath: string,
  mimeType: string,
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "register_media_for_sticker",
    {
      p_album_id: albumId,
      p_storage_path: storagePath,
      p_mime_type: mimeType,
    },
  );

  if (error) {
    throw new Error(
      `No se pudo guardar la foto: ${error.message}`,
    );
  }

  revalidatePath("/app");
  revalidatePath(`/album/${slug}`);
}

export async function setAlbumCover(
  albumId: string,
  storagePath: string,
  slug: string,
) {
  const supabase = await requireAdmin();

  const { error } = await supabase.rpc(
    "set_album_cover_for_sticker",
    {
      p_album_id: albumId,
      p_storage_path: storagePath,
    },
  );

  if (error) {
    throw new Error(
      `No se pudo actualizar la portada: ${error.message}`,
    );
  }

  revalidatePath("/app");
  revalidatePath(`/album/${slug}`);
}

export async function deleteMedia(
  mediaId: string,
  storagePath: string,
  albumId: string,
  slug: string,
) {
  const supabase = await requireAdmin();

  // Primero eliminamos el archivo físico de Storage.
  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([storagePath]);

  if (storageError) {
    throw new Error(
      `No se pudo eliminar la foto: ${storageError.message}`,
    );
  }

  // Después eliminamos el registro mediante la función segura.
  const { error } = await supabase.rpc(
    "delete_media_for_sticker",
    {
      p_media_id: mediaId,
      p_album_id: albumId,
      p_storage_path: storagePath,
    },
  );

  if (error) {
    throw new Error(
      `No se pudo eliminar la foto: ${error.message}`,
    );
  }

  revalidatePath("/app");
  revalidatePath(`/album/${slug}`);
}