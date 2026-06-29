import { ButtonHTMLAttributes, ReactNode } from "react";

interface GoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function GoldButton({ children, variant = "primary", className = "", ...props }: GoldButtonProps) {
  const baseStyles = "font-sans uppercase tracking-[0.1em] font-medium transition-all duration-300 inline-flex items-center justify-center text-center";
  
  if (variant === "primary") {
    return (
      <button 
        className={`${baseStyles} px-8 py-[14px] rounded-md text-[var(--color-blue-deep)] bg-gradient-to-br from-[var(--color-gold-primary)] to-[var(--color-gold-light)] hover:scale-[1.03] hover:shadow-[0_6px_32px_rgba(var(--color-gold-primary-rgb),0.50)] shadow-[0_4px_24px_rgba(var(--color-gold-primary-rgb),0.30)] ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button 
      className={`${baseStyles} px-8 py-[14px] rounded-md text-[var(--foreground)] bg-transparent border border-[var(--color-blue-primary)] hover:border-[var(--color-blue-light)] hover:bg-[rgba(var(--color-blue-primary-rgb),0.15)] hover:shadow-[0_0_20px_rgba(var(--color-blue-primary-rgb),0.25)] ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
