import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ".././globals.css";
import UserProvider from './../_context/UserProvider';
import AdminNavbar from "./../_components/AdminNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BULKY || ADMIN PANEL",
  description: "This is the Bulky Admin Panel where you can manage the application settings and users.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
                <AdminNavbar />
              {children}
        </UserProvider>
      </body>
    </html>
  );
}
