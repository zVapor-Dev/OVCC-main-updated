"use client";

import type { ImgHTMLAttributes } from "react";

export function FallbackImage({
  fallback,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { fallback: string }) {
  function recoverImage(img: Pick<HTMLImageElement, "src" | "baseURI" | "complete" | "naturalWidth"> | null) {
    if (!img || !img.complete || img.naturalWidth !== 0) return;
    const fallbackUrl = new URL(fallback, img.baseURI).href;
    if (img.src !== fallbackUrl) img.src = fallbackUrl;
  }

  return (
    <img
      {...props}
      alt={props.alt ?? ""}
      // An SSR image can fail before React attaches its error handler.
      ref={recoverImage}
      onError={(e) => recoverImage(e.currentTarget)}
    />
  );
}
