"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { IconButton } from "./IconButton";

interface AvatarCardProps {
  id: number;
  previewSrc: string;
  fullSrc: string;
}

const ClipboardIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.1667 3.16634H12.8334V14.1663H3.16675V3.16634H5.83341M5.83341 1.83301H10.1667V4.83301H5.83341V1.83301Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5 9.83333V13.5H2.5V9.83333M7.99999 2.5L8 9.33333M5.66667 7.66667L7.99999 10L10.3333 7.66667"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="square"
    />
  </svg>
);

export function AvatarCard({ id, previewSrc, fullSrc }: AvatarCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const copiedRef = useRef<HTMLDivElement>(null);

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(fullSrc);
      const blob = await response.blob();

      // Convert to PNG as clipboard only supports PNG
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      URL.revokeObjectURL(img.src);

      const pngBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);

      // Show copied animation
      if (copiedRef.current) {
        gsap.killTweensOf(copiedRef.current);
        gsap.fromTo(
          copiedRef.current,
          { opacity: 0, scale: 0.8, y: 10 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "back.out(1.7)",
          }
        );
        gsap.to(copiedRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          delay: 1.2,
          ease: "power2.in",
        });
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fullSrc;
    link.download = `avatar-${id.toString().padStart(3, "0")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseEnter = () => {
    gsap.to(circleRef.current, {
      scale: 1.08,
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.to(buttonsRef.current, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(circleRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    });
    gsap.to(buttonsRef.current, {
      opacity: 0,
      y: 8,
      filter: "blur(4px)",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDownload();
  };

  return (
    <div
      ref={cardRef}
      className="relative flex aspect-square items-center justify-center rounded-[20px] bg-white/[0.04] cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCopyToClipboard}
    >
      <div
        ref={circleRef}
        className="relative size-[96px] rounded-full overflow-hidden"
      >
        <Image
          src={previewSrc}
          alt={`Avatar ${id.toString().padStart(3, "0")}`}
          fill
          className="object-cover"
        />
      </div>

      <span className="absolute top-5 left-5 text-xs font-medium text-white/[0.48] leading-4 tracking-[0.12px]">
        {id.toString().padStart(3, "0")}
      </span>

      {/* Copied to clipboard overlay */}
      <div
        ref={copiedRef}
        className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none"
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 13L9 17L19 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs font-medium text-white/[0.88]">Copied</span>
        </div>
      </div>

      <div
        ref={buttonsRef}
        className="absolute bottom-4 right-4 flex gap-1 items-center opacity-0 translate-y-2 blur-[4px]"
      >
        <IconButton onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(); }} title="Copy to clipboard">
          <ClipboardIcon />
        </IconButton>
        <IconButton onClick={handleDownloadClick} title="Download">
          <DownloadIcon />
        </IconButton>
      </div>
    </div>
  );
}
