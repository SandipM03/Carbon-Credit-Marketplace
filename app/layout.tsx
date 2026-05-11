import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { RoleNavigation } from "./components/RoleNavigation";
import "./globals.css";

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "GreenCredits | Carbon Credit Marketplace",
  description:
    "A climate-tech marketplace connecting farmers and buyers with verified carbon projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[color:var(--foreground)]">
        <ConvexClientProvider>
          <RoleNavigation />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}
