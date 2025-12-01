"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

const MAX_TOASTS = 4;

interface ToastData {
  id: number;
}

function SingleToast({
  index,
  total,
  isNew,
  onAnimationComplete
}: {
  index: number;
  total: number;
  isNew: boolean;
  onAnimationComplete?: () => void;
}) {
  const toastRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGPathElement>(null);

  const depth = total - 1 - index;
  const scale = 1 - depth * 0.05;
  const yOffset = depth * -6;
  const opacity = 1 - depth * 0.2;
  const zIndex = total - depth;

  useEffect(() => {
    if (!toastRef.current || !checkRef.current) return;

    const toast = toastRef.current;
    const check = checkRef.current;

    if (isNew && index === total - 1) {
      // Animate in the newest toast
      gsap.set(check, { strokeDashoffset: 24 });

      gsap.fromTo(toast,
        { opacity: 0, y: 16, scale: scale * 0.95 },
        { opacity, y: yOffset, scale, duration: 0.25, ease: "back.out(2)" }
      );

      gsap.to(check, {
        strokeDashoffset: 0,
        duration: 0.2,
        delay: 0.1,
        ease: "power2.out",
      });
    } else {
      // Animate existing toasts to new position
      gsap.to(toast, {
        y: yOffset,
        scale,
        opacity,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  }, [index, total, isNew, scale, yOffset, opacity]);

  useEffect(() => {
    if (!toastRef.current || index !== 0) return;

    // Only the oldest toast (index 0) handles exit
    const timer = setTimeout(() => {
      if (toastRef.current) {
        gsap.to(toastRef.current, {
          opacity: 0,
          y: yOffset + 8,
          duration: 0.2,
          ease: "power2.in",
          onComplete: onAnimationComplete,
        });
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [index, yOffset, onAnimationComplete]);

  return (
    <div
      ref={toastRef}
      className="absolute left-0 right-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/[0.08] shadow-lg shadow-black/20"
      style={{ zIndex, opacity: 0 }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          ref={checkRef}
          d="M5 13L9 17L19 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          strokeDashoffset="24"
        />
      </svg>
      <span className="text-sm font-medium text-white/[0.88]">
        Copied to clipboard
      </span>
    </div>
  );
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isNew, setIsNew] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    const handleShowToast = () => {
      const id = idRef.current++;
      setIsNew(true);
      setToasts((prev) => {
        const updated = [...prev, { id }];
        return updated.slice(-MAX_TOASTS);
      });
      // Reset isNew on next frame
      requestAnimationFrame(() => setIsNew(false));
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => window.removeEventListener("show-toast", handleShowToast);
  }, []);

  const handleRemoveOldest = useCallback(() => {
    setToasts((prev) => prev.slice(1));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 z-50" style={{ transform: "translateX(-50%)" }}>
      <div className="relative h-10 w-[200px]">
        {toasts.map((toast, index) => (
          <SingleToast
            key={toast.id}
            index={index}
            total={toasts.length}
            isNew={isNew}
            onAnimationComplete={index === 0 ? handleRemoveOldest : undefined}
          />
        ))}
      </div>
    </div>
  );
}
