import { ProfileImage } from "./OptimizedImage";

interface PersonCardProps {
  name: string;
  role: string;
  imageUrl: string;
  size?: "large" | "medium";
  imagePosition?: string;
  imageSizeOffset?: string;
}

export function PersonCard({ name, role, imageUrl, size = "medium", imagePosition = "center", imageSizeOffset = "cover" }: PersonCardProps) {
  const imageSize = size === "large" ? "w-[220px] h-[220px]" : "w-[120px] h-[120px]";
  const pixelSize = size === "large" ? 208 : 108;

  return (
    <div className="flex flex-col items-center text-center group cursor-default">
      <div 
        className={`relative rounded-full p-[2px] ${imageSize} mb-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] group-hover:shadow-[0_0_0_4px_rgba(27,58,140,0.20),0_0_0_8px_rgba(240,180,41,0.10),0_0_32px_rgba(240,180,41,0.15)]`}
        style={{ background: 'linear-gradient(var(--color-bg-secondary), var(--color-bg-secondary)) padding-box, linear-gradient(135deg, var(--color-blue-primary) 0%, var(--color-gold-primary) 50%, var(--color-gold-light) 100%) border-box', border: '2px solid transparent' }}
      >
        <ProfileImage
          src={imageUrl}
          alt={name}
          size={pixelSize}
          imagePosition={imagePosition}
          imageSizeOffset={imageSizeOffset}
          className="rounded-full border-4 border-[#0D0B0E]"
        />
      </div>
      <h3 className="font-display font-semibold text-[clamp(18px,2vw,24px)] text-[#FFFFFF] transition-colors duration-300 group-hover:text-[#F0B429]">
        {name}
      </h3>
      <p className="font-serif italic text-[#B8860B] text-[clamp(13px,1.4vw,16px)] tracking-[0.04em] mt-1">
        {role}
      </p>
    </div>
  );
}
