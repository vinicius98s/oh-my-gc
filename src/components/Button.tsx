import { ButtonHTMLAttributes } from "react";

import { cn } from "../utils/lib";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "text-white cursor-pointer font-medium rounded-md px-5 py-1 shadow-[inset_1px_2px_4px_0_rgba(0,0,0,0.25)] outline-2 -outline-offset-2 disabled:cursor-default focus-visible:outline-white",
        variant === "primary"
          ? "bg-linear-to-t from-[#004585] to-[#0FB8FF] outline-white/20 disabled:from-light-gray disabled:to-gray"
          : "bg-white/5 hover:bg-white/10 outline-white/10 disabled:opacity-50",
        props.className
      )}
    >
      {children}
    </button>
  );
}
