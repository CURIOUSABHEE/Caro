import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  // Only preload the weights actually used in the browser UI (300, 400, 700, 800).
  // Intermediate weights (500, 600) are handled by font interpolation.
  weight: ["300", "400", "700", "800"],
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  // Playfair is only used inside Satori-rendered slide PNGs (loaded via fonts.ts server-side).
  // Telling Next.js not to emit a preload hint for it prevents the 'preloaded but not used' warning.
  preload: false,
});

export const metadata: Metadata = {
  title: "Caro — Blog-to-Carousel Slide Deck Generator",
  description: "Transform your blog articles into high-performing, professionally styled Instagram and LinkedIn carousels in seconds. Fully customizable, no login required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-neutral-950 text-neutral-100 font-sans">
        {children}
      </body>
    </html>
  );
}
