import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barnscape Studios — Event Space",
  description: "Book our modern event space for your perfect gathering",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#0a0a0f] text-[#e4e4ed]">
        {children}
      </body>
    </html>
  );
}
