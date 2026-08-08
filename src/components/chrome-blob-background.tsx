"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export function ChromeBlobBackground() {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const tertiaryRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0, scroll: 0 });
  const current = useRef({ x: 0, y: 0, scroll: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function onMouseMove(e: MouseEvent) {
      target.current.x = e.clientX / window.innerWidth - 0.5;
      target.current.y = e.clientY / window.innerHeight - 0.5;
    }
    function onScroll() {
      target.current.scroll = window.scrollY;
    }

    if (!reduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    let raf = 0;
    function tick(now: number) {
      const t = now / 1000;
      const c = current.current;
      const tgt = target.current;
      c.x += (tgt.x - c.x) * 0.05;
      c.y += (tgt.y - c.y) * 0.05;
      c.scroll += (tgt.scroll - c.scroll) * 0.08;

      // Chaque forme flotte en continu (sinusoïdes à fréquences/phases différentes,
      // jamais synchronisées) + une légère parallaxe souris/scroll par-dessus —
      // pour un mouvement liquide plutôt qu'un suivi mécanique du curseur.
      if (primaryRef.current) {
        const floatX = Math.sin(t * 0.22) * 26;
        const floatY = Math.cos(t * 0.17) * 20;
        const rot = 8 + Math.sin(t * 0.11) * 6;
        primaryRef.current.style.transform = `translate3d(${floatX + c.x * 28}px, ${floatY + c.y * 22 + c.scroll * 0.22}px, 0) rotate(${rot}deg)`;
      }
      if (secondaryRef.current) {
        const floatX = Math.sin(t * 0.19 + 2.1) * 24;
        const floatY = Math.cos(t * 0.15 + 1.3) * 18;
        const rot = 152 + Math.sin(t * 0.09 + 1) * 6;
        secondaryRef.current.style.transform = `translate3d(${floatX + c.x * -20}px, ${floatY + c.y * -16 + c.scroll * 0.38}px, 0) rotate(${rot}deg)`;
      }
      if (tertiaryRef.current) {
        const floatX = Math.sin(t * 0.26 + 4.2) * 16;
        const floatY = Math.cos(t * 0.2 + 3.1) * 14;
        const rot = 60 + Math.sin(t * 0.13 + 2) * 8;
        tertiaryRef.current.style.transform = `translate3d(${floatX + c.x * 14}px, ${floatY + c.y * 10 + c.scroll * 0.14}px, 0) rotate(${rot}deg)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={primaryRef}
        className="pointer-events-none absolute -top-40 -right-80 will-change-transform sm:-right-64 lg:-right-48 lg:top-[-11rem]"
      >
        <Image
          src="/p.png"
          alt=""
          aria-hidden
          width={1050}
          height={600}
          priority
          className="h-auto w-[820px] max-w-none opacity-95 sm:w-[1150px] lg:w-[1500px] xl:w-[1750px]"
        />
      </div>

      <div
        ref={secondaryRef}
        className="pointer-events-none absolute top-[6%] -left-72 will-change-transform sm:top-[8%] sm:-left-52 lg:top-[2%] lg:-left-32"
      >
        <Image
          src="/p.png"
          alt=""
          aria-hidden
          width={1050}
          height={600}
          priority
          className="h-auto w-[700px] max-w-none opacity-90 sm:w-[980px] lg:w-[1300px] xl:w-[1500px]"
        />
      </div>

      <div
        ref={tertiaryRef}
        className="pointer-events-none absolute -bottom-32 left-1/2 hidden -translate-x-1/2 will-change-transform sm:block"
      >
        <Image
          src="/p.png"
          alt=""
          aria-hidden
          width={1050}
          height={600}
          className="h-auto w-[560px] max-w-none opacity-45 blur-sm lg:w-[760px]"
        />
      </div>
    </>
  );
}
