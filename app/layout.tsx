import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Survey Analytics Dashboard",
  description: "Analytics dashboard for survey insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}