"use client";

import { AvatarCard } from "@/components/AvatarCard";
import { Toast } from "@/components/Toast";
import { useEffect, useState } from "react";

const OutpaceLogo = () => (
  <svg
    width="33"
    height="12"
    viewBox="0 0 33 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 6C16.5 2.68629 13.7298 0 10.3125 0H6.1875C2.77024 0 0 2.68629 0 6C0 9.31371 2.77024 12 6.1875 12H10.3125C13.7298 12 16.5 9.31371 16.5 6Z"
      fill="white"
      fillOpacity="0.88"
    />
    <path
      d="M16.5 0H29.9062C31.6149 0 33 1.34315 33 3C33 4.65685 31.6149 6 29.9062 6H22.6875C19.2702 6 16.5 3.31371 16.5 0Z"
      fill="white"
      fillOpacity="0.88"
    />
    <path
      d="M24.75 12C26.4586 12 27.8437 10.6569 27.8437 9C27.8437 7.34315 26.4586 6 24.75 6H22.6875C19.2702 6 16.5 8.68629 16.5 12H24.75Z"
      fill="white"
      fillOpacity="0.88"
    />
  </svg>
);

const avatars = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  previewSrc: `/avatars/previews/gradient-${i}.webp`,
  fullSrc: `/avatars/gradient-${i}.jpg`,
}));

export default function Home() {
  const [showTopBlur, setShowTopBlur] = useState(false);
  const [showBottomBlur, setShowBottomBlur] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;

      setShowTopBlur(scrollTop > 50);
      setShowBottomBlur(scrollBottom > 50);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative flex flex-col gap-12 items-center pb-10 min-h-screen">
      {/* Top gradient */}
      <div
        className={`fixed top-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
          showTopBlur ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to bottom, #0A0A0A 0%, transparent 100%)",
        }}
      />

      {/* Bottom gradient */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-[80px] z-[5] pointer-events-none transition-opacity duration-300 ${
          showBottomBlur ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(to top, #0A0A0A 0%, transparent 100%)",
        }}
      />

      <div className="flex flex-col gap-6 items-center w-full pt-10">
        <OutpaceLogo />

        <div className="flex flex-col gap-3 w-full px-4">
          <header className="sticky top-4 z-10 flex items-center justify-between w-full rounded-[10px] px-4 md:px-5 py-3">
            <p className="text-sm font-semibold text-white/[0.88] leading-5 tracking-[0.14px]">
              Avatars
            </p>
            <p className="text-sm font-semibold text-white/[0.88] leading-5 tracking-[0.14px]">
              by Outpace Studios
            </p>
          </header>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 w-full">
            {avatars.map((avatar, index) => (
              <AvatarCard
                key={avatar.id}
                id={avatar.id}
                index={index}
                previewSrc={avatar.previewSrc}
                fullSrc={avatar.fullSrc}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-10 items-center text-center">
        <div className="flex flex-col gap-2 items-center text-sm leading-5 tracking-[0.14px]">
          <p className="font-medium text-white/[0.48]">Handcrafted by</p>
          <a
            href="https://outpacestudios.com"
            target="_blank"
            className="font-semibold text-white/[0.88]"
          >
            Outpace Studios
          </a>
        </div>
        <p className="text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
          Free to use, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>.
        </p>
      </div>

      <Toast />
    </div>
  );
}
