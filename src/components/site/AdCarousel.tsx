import { Scroller } from "@/components/site/Client";
import { adHref } from "@/lib/queries";

type Ad = { id: string; title: string; image: string | null; link: string | null };

/** Banners rotativos (um por vez numa coluna estreita, vários lado a lado numa faixa larga). */
export function AdCarousel({ ads }: { ads: Ad[] }) {
  const list = ads.filter((a) => a.image);
  if (list.length === 0) return null;
  return (
    <Scroller label="Publicidade">
      {list.map((ad) => {
        const img = <img src={ad.image ?? ""} alt={ad.title} loading="lazy" />;
        return ad.link ? (
          <a key={ad.id} href={adHref(ad.id)} className="ad" target="_blank" rel="noopener sponsored">
            {img}
          </a>
        ) : (
          <div key={ad.id} className="ad">
            {img}
          </div>
        );
      })}
    </Scroller>
  );
}
