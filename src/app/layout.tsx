import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barnscape Studios - Event Space Booking",
  description: "Book our modern event space for your perfect gathering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white">
        {children}
      </body>
    </html>
  );
}
