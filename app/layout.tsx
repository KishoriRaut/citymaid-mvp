import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FooterWrapper from "./components/FooterWrapper";
import HeaderWrapper from "./components/HeaderWrapper";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CityMaid - Find Domestic Helpers in Nepal",
  description: "Connect with reliable domestic helpers in Nepal. Find maids, housekeepers, and other domestic workers easily.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <HeaderWrapper />
          <main className="flex-grow">
            {children}
          </main>
          <FooterWrapper />
          <Toaster position="top-right" />
        </div>
      </body>
    </html>
  );
}
