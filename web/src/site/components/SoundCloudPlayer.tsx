import { soundcloudEmbed } from '@/lib/format';

/** Reproductor embebido de SoundCloud (sección Podcast). Carga diferida. */
export function SoundCloudPlayer({ url, title }: { url: string; title: string }) {
  return (
    <div className="player">
      <iframe title={`Reproductor: ${title}`} src={soundcloudEmbed(url)} width="100%" height="166" loading="lazy" allow="autoplay" style={{ border: 0 }} />
    </div>
  );
}
