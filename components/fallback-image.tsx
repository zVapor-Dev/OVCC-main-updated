"use client";

import type { ImgHTMLAttributes } from "react";

export function FallbackImage({
  fallback,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { fallback: string }) {
  return (
    <img
      {...props}
      alt={props.alt ?? ""}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src !== new URL(fallback, location.href).href) img.src = fallback;
      }}
    />
  );
}
