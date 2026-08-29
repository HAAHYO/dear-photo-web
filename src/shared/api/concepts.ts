import { api } from "./axios";

export type ConceptSummary = {
  id: number;
  name: string;
  description: string;
};

export type ConceptDetail = ConceptSummary & {
  bgmUrl?: string;
  shutterSoundUrl?: string;
  frameImageUrl?: string;
};

export type Sticker = {
  id: number;
  name: string;
  imageUrl: string;
};

export async function getConcepts(): Promise<ConceptSummary[]> {
  const { data } = await api.get<ConceptSummary[]>("/concepts");
  return data;
}

export async function getConceptDetail(
  conceptId: number
): Promise<ConceptDetail> {
  const { data } = await api.get<ConceptDetail>(`/concepts/${conceptId}`);
  return data;
}

export async function getConceptStickers(
  conceptId: number
): Promise<Sticker[]> {
  const { data } = await api.get<Sticker[]>(
    `/concepts/${conceptId}/stickers`
  );
  return data;
}
