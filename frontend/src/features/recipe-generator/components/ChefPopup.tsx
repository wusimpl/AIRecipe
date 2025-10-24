"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ChefPopupProps {
  show?: boolean;
  delay?: number;
  className?: string;
}

export const ChefPopup = ({ show = true, delay = 200, className }: ChefPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setIsVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [show, delay]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={
        [
          "pointer-events-none absolute -top-6 right-0 z-40 hidden transform-gpu",
          "md:block md:translate-x-[12%] md:-translate-y-[6%]",
          "lg:translate-x-[10%] lg:-translate-y-[10%]",
          "xl:translate-x-[8%] xl:-translate-y-[12%]",
          "2xl:translate-x-[6%] 2xl:-translate-y-[14%]",
          className ?? "",
        ]
          .join(" ")
          .trim()
      }
    >
      <Image
        alt="厨师"
        src="/chef.png"
        width={176}
        height={176}
        priority
        className="h-auto w-44 origin-bottom-left animate-chef-appear md:w-52 lg:w-60 2xl:w-72"
      />
    </div>
  );
};
