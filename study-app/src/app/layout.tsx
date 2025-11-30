import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ML Experiment Tracker | Study Plan",
  description:
    "4-day interview study plan for ML Experiment Tracker. Python, FastAPI, React, Kubernetes, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Script
          src="https://cost.sidapi.com/embed-direct.js"
          data-power-widget-direct
          data-position="bottom-right"
          data-theme="dark"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
