import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "outline";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-[0_4px_0_var(--color-coral-dark)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--color-coral-dark)] active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-coral-dark)]",
  ghost:
    "bg-white text-ink border border-line hover:border-ink hover:-translate-y-0.5",
  outline:
    "bg-transparent text-ink border border-ink hover:bg-ink hover:text-white",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`cursor-pointer rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
});
