"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/** Anima elementos com data-reveal quando entram na tela. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='in'])");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.reveal = "in";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}

/** Barra fixa no celular com orçamento + WhatsApp (aparece depois de rolar). */
export function MobileBar({ whatsappHref }: { whatsappHref: string | null }) {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (pathname.startsWith("/orcamento")) return null;
  return (
    <div className="mobile-bar" data-show={show}>
      <Link href="/orcamento" className="btn btn--yellow">
        Solicitar orçamento grátis
      </Link>
      {whatsappHref && (
        <a href={whatsappHref} target="_blank" rel="noopener" className="btn btn--wa" aria-label="WhatsApp">
          <Icon name="whatsapp" size={22} />
        </a>
      )}
    </div>
  );
}

/** Carrossel horizontal com setas (anúncios). */
export function Scroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  // Avança os letreiros/banners para a esquerda logo após o carregamento;
  // pausa quando o mouse está em cima e volta ao início no final.
  useEffect(() => {
    const el = ref.current;
    if (!el || el.childElementCount < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchstart", onEnter, { passive: true });
    el.addEventListener("touchend", onLeave, { passive: true });
    const t = window.setInterval(() => {
      if (paused || !ref.current) return;
      const nearEnd = ref.current.scrollLeft + ref.current.clientWidth >= ref.current.scrollWidth - 8;
      if (nearEnd) ref.current.scrollTo({ left: 0, behavior: "smooth" });
      else go(1);
    }, 4000);
    return () => {
      window.clearInterval(t);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchstart", onEnter);
      el.removeEventListener("touchend", onLeave);
    };
  }, []);

  return (
    <div>
      <div className="ads-head">
        <small>{label}</small>
        <div className="ads-arrows">
          <button className="round-btn" onClick={() => go(-1)} aria-label="Anterior">
            <Icon name="arrowLeft" size={16} />
          </button>
          <button className="round-btn" onClick={() => go(1)} aria-label="Próximo">
            <Icon name="arrowRight" size={16} />
          </button>
        </div>
      </div>
      <div className="ads" ref={ref}>
        {children}
      </div>
    </div>
  );
}
