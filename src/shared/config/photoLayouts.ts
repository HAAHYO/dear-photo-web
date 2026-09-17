// 포토부스 컷 레이아웃 정의. capture(촬영)와 edit(꾸미기) 페이지가 함께 참조해서
// 몇 장을 찍을지, 그 사진들을 프레임 안에 몇 행/열로 배치할지를 결정한다.
//
// 컷 수가 같아도 세로/가로 방향이 둘 다 있을 수 있어서(2컷, 3컷),
// UI에서는 "컷 수"를 먼저 고르고 그 컷 수에 방향이 여럿이면 세로/가로를 추가로 고르는
// 2단계 선택으로 쓴다 (orientationLabel이 그 두 번째 단계에 쓰는 짧은 라벨).
export type PhotoLayout = {
  id: string;
  label: string;
  orientationLabel: string;
  shots: number;
  cols: number;
  rows: number;
  /** 슬롯 1개의 세로 길이(스케일 적용 전 논리 px). 레이아웃마다 사진 비율 느낌이 다르다 */
  slotH: number;
};

// slotH는 "슬롯 1칸 가로폭 대비 적당한 비율"이 나오도록 역산해서 정한 값이다
// (FRAME_W=400, PAD=20, GAP=8 기준). 세로 계열은 완만한 가로 슬라이스(실제 인생네컷
// 느낌), 가로 계열은 인물 사진에 가까운 세로형 비율이 되도록 잡았다.
export const PHOTO_LAYOUTS: PhotoLayout[] = [
  { id: "single", label: "단독 컷", orientationLabel: "기본", shots: 1, cols: 1, rows: 1, slotH: 460 },
  { id: "strip2", label: "2컷 세로", orientationLabel: "세로", shots: 2, cols: 1, rows: 2, slotH: 260 },
  { id: "row2", label: "2컷 가로", orientationLabel: "가로", shots: 2, cols: 2, rows: 1, slotH: 220 },
  { id: "strip3", label: "3컷 세로", orientationLabel: "세로", shots: 3, cols: 1, rows: 3, slotH: 230 },
  { id: "row3", label: "3컷 가로", orientationLabel: "가로", shots: 3, cols: 3, rows: 1, slotH: 145 },
  { id: "strip4", label: "4컷 세로", orientationLabel: "세로", shots: 4, cols: 1, rows: 4, slotH: 200 },
  { id: "grid6", label: "6컷 격자", orientationLabel: "격자", shots: 6, cols: 2, rows: 3, slotH: 135 },
];

export const DEFAULT_LAYOUT_ID = "strip4";

export function getPhotoLayout(id: string | undefined): PhotoLayout {
  return PHOTO_LAYOUTS.find((l) => l.id === id) ?? PHOTO_LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT_ID)!;
}

/** 촬영 화면에서 쓸 "컷 수" 1단계 목록 (오름차순, 중복 없이) */
export const SHOT_COUNTS = Array.from(new Set(PHOTO_LAYOUTS.map((l) => l.shots))).sort((a, b) => a - b);

/** 특정 컷 수에 해당하는 레이아웃(방향) 목록 */
export function layoutsForShotCount(shots: number): PhotoLayout[] {
  return PHOTO_LAYOUTS.filter((l) => l.shots === shots);
}

// 소포(사진) 프레임 기하 상수. capture(촬영 미리보기)와 edit(실제 합성) 페이지가
// 반드시 같은 값을 써야 "카메라로 본 구도"와 "인화된 결과물"이 어긋나지 않는다.
export const FRAME_W = 400;
export const PAD = 20;
export const GAP = 8;
export const FOOTER_SPACE = 48;

export function frameHeightFor(layout: PhotoLayout) {
  return PAD * 2 + layout.slotH * layout.rows + GAP * (layout.rows - 1) + FOOTER_SPACE;
}

export function slotWidthFor(layout: PhotoLayout) {
  return (FRAME_W - PAD * 2 - GAP * (layout.cols - 1)) / layout.cols;
}

/** 슬롯 1칸의 가로/세로 비율. 촬영 화면 카메라 프리뷰를 이 비율로 맞추면
 * 찍을 때 본 구도 그대로 최종 결과물에 나온다(엉뚱하게 잘리지 않는다). */
export function slotAspectRatio(layout: PhotoLayout) {
  return slotWidthFor(layout) / layout.slotH;
}
