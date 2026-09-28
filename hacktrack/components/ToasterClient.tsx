"use client";

import { Toaster } from "sonner";

export function ToasterClient() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          "brutal-border brutal-shadow rounded-lg font-bold text-sm bg-white text-[#121212]",
        style: {
          border: "3px solid #121212",
          boxShadow: "4px 4px 0px #121212",
        },
      }}
    />
  );
}
