import Image from "next/image";

type ProfileImageProps = {
  src: string;
  alt: string;
  size: number;
  imagePosition?: string;
  imageSizeOffset?: string;
  priority?: boolean;
  className?: string;
};

export function ProfileImage({
  src,
  alt,
  size,
  imagePosition = "center",
  imageSizeOffset = "cover",
  priority = false,
  className = "",
}: ProfileImageProps) {
  const zoom = imageSizeOffset === "cover" ? 1 : parseFloat(imageSizeOffset) / 100;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        sizes={`${size}px`}
        quality={85}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="h-full w-full object-cover"
        style={{
          objectPosition: imagePosition,
          transform: zoom > 1 ? `scale(${zoom})` : undefined,
          transformOrigin: imagePosition,
        }}
      />
    </div>
  );
}
