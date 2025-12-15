import { ButtonHTMLAttributes } from "react";

import { cn } from "../utils/lib";

export default function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "cursor-pointer font-medium rounded-md px-5 py-1 bg-linear-to-t from-[#004585] to-[#0FB8FF] shadow-[inset_1px_2px_4px_0_rgba(0,0,0,0.25)] outline-2 outline-white/20 -outline-offset-2 disabled:cursor-default disabled:from-light-gray disabled:to-gray focus-visible:outline-white",
        props.className,
      )}
    >
      {children}
    </button>
  );
}
