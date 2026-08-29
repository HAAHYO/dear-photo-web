import { api } from "./axios";

export type DiaryEntry = {
  id: number;
  photoId: number;
  content: string;
  createdAt: string;
};

export type DiaryPage = {
  content: DiaryEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export async function getDiaryEntries(
  userId: number,
  page = 0,
  size = 12
): Promise<DiaryPage> {
  const { data } = await api.get<DiaryPage>("/diary/entries", {
    params: { userId, page, size },
  });
  return data;
}

export async function saveDiaryEntry(
  userId: number,
  payload: { photoId: number; content: string }
): Promise<DiaryEntry> {
  const { data } = await api.post<DiaryEntry>("/diary/entries", payload, {
    params: { userId },
  });
  return data;
}

export async function deleteDiaryEntry(
  userId: number,
  entryId: number
): Promise<void> {
  await api.delete(`/diary/entries/${entryId}`, { params: { userId } });
}
