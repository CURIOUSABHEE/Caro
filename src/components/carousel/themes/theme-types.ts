import type { RenderSlideInput } from "../types";
import type { ThemeColors } from "@/lib/types";
import type { ThemeTokens } from "./tokens/types";

export interface ThemeSlideProps {
  slide: RenderSlideInput;
  type: RenderSlideInput["type"];
  title: string;
  body: string;
  username: string;
  websiteUrl: string;
  visualData: Record<string, unknown> | undefined;
  visualType: string | undefined;
  order: number;
  totalSlides: number;
  isLast: boolean;
  pageLabel: string;
  displayUsername: string;
  hasBgImage: boolean;
  bgImageStyle: React.CSSProperties;
  shapes: RenderSlideInput["shapes"];
  scribble: boolean | undefined;
  imageUrl: string | null | undefined;
  imageLayout: "background" | "inline" | undefined;
  tokens?: ThemeTokens;
}

export type ThemeRenderFn = (props: ThemeSlideProps) => React.ReactElement;
