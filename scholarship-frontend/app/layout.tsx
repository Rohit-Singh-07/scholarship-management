"use client";

import { Provider } from "react-redux";
import { store } from "@/src/store";
import "./globals.css";
import Navbar from "@/src/components/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <Navbar />
          {children}
        </Provider>
      </body>
    </html>
  );
}
