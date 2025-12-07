export type FiveElement = "wood" | "fire" | "earth" | "metal" | "water";
export type PillarKey = "hour" | "day" | "month" | "year";

export type PillarInfo = {
  stem: string;
  branch: string;
  element: FiveElement;
  branchElement?: FiveElement;
  tenGod?: string;
  tenGodBranch?: string;
  hiddenStem?: string;
  twelveSpirit?: string;
  twelveKiller?: string;
  auspicious?: string;
  inauspicious?: string;
  label?: string;
};

export type SajuResultPayload = {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  zodiacText?: string;
  pillars: Record<PillarKey, PillarInfo>;
  sipseong?: Partial<Record<PillarKey, string>>;
  woonsung?: Partial<Record<PillarKey, string>>;
  inmyeonggang?: number;
  ohangScores: Record<FiveElement, number>;
  balance?: {
    geumun: number;
    seongsaundong: number;
  };
  analysis?: {
    strengthIndex?: number; // 0~100
    strengthLabel?: string;
    fiveElementDetail?: Partial<Record<FiveElement, number>>;
    tenGodSummary?: string;
  };
  meta?: {
    source?: string;
    savedAt?: string;
  };
};
