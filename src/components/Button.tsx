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
        "disabled:cursor-default cursor-pointer disabled:from-light-gray disabled:to-gray bg-linear-to-t from-[#004585] to-[#0FB8FF] rounded-md px-5 py-1 font-medium outline-2 outline-white/20 -outline-offset-2 shadow-[inset_1px_2px_4px_0_rgba(0,0,0,0.25)]",
        props.className,
      )}
    >
      {children}
    </button>
  );
}
