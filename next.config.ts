import type { NextConfig } from "next";

const config: NextConfig = {
  async redirects() {
    return [
      { source: "/index", destination: "/", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/event.html", destination: "/event", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/events.php", destination: "/api/events" },
      { source: "/partners.php", destination: "/api/partners" },
    ];
  },
};

export default config;
