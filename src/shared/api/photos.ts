import { api } from "./axios";

export type PhotoDraft = {
  id: number;
};

export async function uploadPhotoDraft(
  file: Blob,
  conceptId: number
): Promise<PhotoDraft> {
  const form = new FormData();
  form.append("file", file, "dear-photo.png");

  const { data } = await api.post<PhotoDraft>("/photos/draft", form, {
    params: { conceptId },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function getPhotoDownloadUrl(photoId: number): string {
  const base = api.defaults.baseURL ?? "";
  return `${base}/photos/${photoId}/download`;
}

export async function fetchPhotoBlob(photoId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/photos/${photoId}/download`, {
    responseType: "blob",
  });
  return data;
}
