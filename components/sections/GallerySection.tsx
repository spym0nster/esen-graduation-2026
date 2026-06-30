"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GALLERY_ASPECT, GALLERY_IMAGES } from "@/lib/images";

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowRight") setSelectedImage((prev) => (prev !== null && prev < GALLERY_IMAGES.length - 1 ? prev + 1 : prev));
      if (e.key === "ArrowLeft") setSelectedImage((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  return (
    <section id="gallery" className="relative w-full py-[clamp(80px,10vw,160px)] bg-[#1A1410] overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: { opacity: 0, y: 24 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7 } }
        }}
        className="text-center mb-16 md:mb-24 px-4"
      >
        <h2 className="font-display text-[clamp(32px,4vw,60px)] text-white text-glow-gold">
          Memories in the Making
        </h2>
      </motion.div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {GALLERY_IMAGES.map((src, index) => (
            <motion.div
              key={src}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay: (index % 3) * 0.1 } }
              }}
              className="break-inside-avoid relative overflow-hidden rounded-[12px] group cursor-pointer"
              onClick={() => setSelectedImage(index)}
            >
              <div className="relative w-full h-64 md:h-auto md:min-h-[300px] bg-[#0D0B0E] transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={src}
                  alt={`Ceremony memory ${index + 1}`}
                  width={1920}
                  height={Math.round(1920 * GALLERY_ASPECT)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  quality={80}
                  loading="lazy"
                  className="h-full w-full object-cover object-center md:h-auto md:min-h-[300px]"
                />
              </div>
              {/* Overlay with subtle gold shimmer */}
              <div className="absolute inset-0 bg-[#0D0B0E]/0 group-hover:bg-[#0D0B0E]/40 transition-colors duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[rgba(201,150,12,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0B0E]/95 backdrop-blur-md p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="absolute top-6 right-6 text-[#E8E0D0] cursor-pointer hover:text-white uppercase text-xs tracking-widest font-sans">
              Close (Esc)
            </div>
            
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-[90vh] w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={GALLERY_IMAGES[selectedImage]}
                alt={`Ceremony memory ${selectedImage + 1}`}
                width={1920}
                height={Math.round(1920 * GALLERY_ASPECT)}
                sizes="100vw"
                quality={90}
                priority
                className="max-h-[90vh] w-auto h-auto rounded-[8px] shadow-[0_0_50px_rgba(201,150,12,0.15)] object-contain"
              />
            </motion.div>

            {selectedImage > 0 && (
              <button 
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(201,150,12,0.2)] text-[#F0C040] hover:bg-[rgba(201,150,12,0.1)] transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage - 1); }}
              >
                ←
              </button>
            )}
            
            {selectedImage < GALLERY_IMAGES.length - 1 && (
              <button 
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(201,150,12,0.2)] text-[#F0C040] hover:bg-[rgba(201,150,12,0.1)] transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage + 1); }}
              >
                →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
