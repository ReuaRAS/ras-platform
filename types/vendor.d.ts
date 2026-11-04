declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(text: string): string;
  };
}

declare module "bidi-js" {
  type EmbeddingLevels = unknown;
  interface BidiInstance {
    getEmbeddingLevels(text: string, dir?: "ltr" | "rtl" | "auto"): EmbeddingLevels;
    getReorderedString(text: string, levels: EmbeddingLevels): string;
    getReorderSegments(text: string, levels: EmbeddingLevels): Array<[number, number]>;
  }
  export default function bidiFactory(): BidiInstance;
}
