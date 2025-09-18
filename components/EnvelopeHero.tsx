import Image from "next/image";

export default function EnvelopeHero() {
  return (
    <div className="w-full">
      <Image
        src="/sn_hero_img.svg"
        alt="Envelope illustration with headline"
        width={1200}
        height={800}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
