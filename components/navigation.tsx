"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { DISCORD, SITE_NAME } from "@/lib/site";

const links = [
  ["About Us", "/#about"],
  ["Team", "/#team"],
  ["Event", "/event"],
  ["Offers", "/#offers"],
  ["Partners", "/#partners"],
  ["FAQ", "/#faq"],
];

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") return;
    const url = new URL(location.href);
    const section = url.searchParams.get("section");
    const target = section && document.getElementById(section);
    if (target) {
      target.scrollIntoView();
      url.searchParams.delete("section");
      window.history.replaceState(window.history.state, "", url);
    }
  }, [pathname]);

  function navLinks() {
    return links.map(([label, href]) => (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={pathname === href ? "page" : undefined}
        className="text-sm text-white/80 hover:text-white aria-[current=page]:text-[#FFBE00]"
      >
        {label}
      </Link>
    ));
  }
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 md:px-12 md:py-6">
      <div className="liquid-glass mx-auto flex max-w-6xl items-center justify-between rounded-full px-6 py-3">
        <Link href="/" onClick={() => setOpen(false)}>
          <img src="/Logo.png" alt={SITE_NAME} className="h-8 w-auto sm:h-9" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {navLinks()}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={DISCORD}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-gray-200 sm:block"
          >
            Discord
          </a>
          <button
            type="button"
            className="liquid-glass rounded-full p-2 lg:hidden"
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="liquid-glass mt-2 flex flex-col gap-5 rounded-2xl p-6 lg:hidden"
        >
          {navLinks()}
          <a href={DISCORD} target="_blank" rel="noreferrer">
            Discord
          </a>
        </nav>
      )}
    </header>
  );
}
