"use client";

import { useRef, useState } from "react";
import { registerMedia } from "@/app/actions/media";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MEDIA_BUCKET,
} from "@/lib/storage";

type UploadButtonProps = {
  albumId: string;
  slug: string;
  stickerCode: string;
  photoCount: number;
  maxPhotos: number;
  onOpen?: () => void;
};

const MAX_IMAGE_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  if (
    file.type === "image/gif" ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  ) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("No se pudo leer la imagen."));
      image.src = imageUrl;
    });

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;

    if (!originalWidth || !originalHeight) {
      return file;
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION /
        Math.max(originalWidth, originalHeight),
    );

    const width = Math.round(originalWidth * scale);
    const height = Math.round(originalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    );

    const blob = await new Promise<Blob | null>(
      (resolve) => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          JPEG_QUALITY,
        );
      },
    );

    if (!blob) {
      return file;
    }

    if (blob.size >= file.size) {
      return file;
    }

    return new File(
      [
        blob,
      ],
      `${file.name.replace(/\.[^/.]+$/, "")}.jpg`,
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function UploadButton({
  albumId,
  slug,
  stickerCode,
  photoCount,
  maxPhotos,
  onOpen,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const albumFull = photoCount >= maxPhotos;

  async function handleFiles(
    fileList: FileList | null,
  ) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    if (photoCount >= maxPhotos) {
      setError(
        "Este álbum ya tiene 20 recuerdos. El álbum está completo.",
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    const availableSlots = maxPhotos - photoCount;
    const selectedFiles = Array.from(fileList);

    if (selectedFiles.length > availableSlots) {
      setError(
        `Solo puedes agregar ${availableSlots} ${
          availableSlots === 1
            ? "foto"
            : "fotos"
        } más. El máximo es de ${maxPhotos} recuerdos.`,
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setError(null);

    const validFiles = selectedFiles.filter(
      (file) =>
        ACCEPTED_IMAGE_TYPES.includes(file.type) &&
        file.size <= MAX_IMAGE_BYTES,
    );

    if (validFiles.length === 0) {
      setError(
        "Solo valen fotos (JPEG, PNG, WebP, HEIC o GIF) de hasta 10 MB.",
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    if (validFiles.length > availableSlots) {
      setError(
        `Solo puedes agregar ${availableSlots} ${
          availableSlots === 1
            ? "foto"
            : "fotos"
        } más.`,
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setUploading(true);

    setProgress({
      done: 0,
      total: validFiles.length,
    });

    const supabase = createClient();

    for (const originalFile of validFiles) {
      try {
        setError(null);

        const file =
          await compressImage(originalFile);

        const path = `${
          stickerCode
        }/${crypto.randomUUID()}.jpg`;

        const { error: uploadError } =
          await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, file, {
              contentType: "image/jpeg",
            });

        if (uploadError) {
          setError(
            `Error Storage: ${uploadError.message}`,
          );
        } else {
          try {
            await registerMedia(
              albumId,
              slug,
              path,
              "image/jpeg",
            );
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "No se ha podido guardar alguna foto.",
            );

            await supabase.storage
              .from(MEDIA_BUCKET)
              .remove([path]);
          }
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No se pudo procesar la foto.",
        );
      }

      setProgress((prev) =>
        prev
          ? {
              ...prev,
              done: prev.done + 1,
            }
          : prev,
      );
    }

    setUploading(false);
    setProgress(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    window.location.reload();
  }

  if (albumFull) {
    return (
      <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-blanco px-5 py-4 text-center shadow-lg">
          <p className="text-sm font-semibold text-foreground">
            🔒 Álbum completo
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Este álbum ya tiene sus 20 recuerdos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4">
      {error ? (
        <p
          role="alert"
          className="max-w-sm rounded-2xl border border-borde bg-blanco px-4 py-2.5 text-center text-sm text-lust shadow-sm"
        >
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) =>
          handleFiles(e.target.files)
        }
      />

      <button
        type="button"
        onClick={() => {
          onOpen?.();
          inputRef.current?.click();
        }}
        disabled={uploading}
        className="inline-flex h-14 min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-full bg-tierra px-7 text-base font-semibold text-blanco shadow-lg shadow-piedra/20 transition-transform duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-70 sm:w-auto sm:min-w-[14rem] sm:text-sm"
      >
        {uploading && progress
          ? `Guardando ${progress.done}/${progress.total}…`
          : `+ Añadir recuerdo (${maxPhotos - photoCount} disponibles)`}
      </button>
    </div>
  );
}