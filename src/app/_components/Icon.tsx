import type { LucideIcon, LucideProps } from "lucide-react";
import { ICONS, type IconName } from "@/lib/icons";
import { tv, type VariantProps } from "@/lib/tv";

export const iconStyles = tv({
  base: "shrink-0",
  variants: {
    size: {
      xs: "size-3",
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
      xl: "size-6",
    },
  },
  defaultVariants: { size: "md" },
});

type IconSource =
  | { name: IconName; icon?: never }
  | { name?: never; icon: LucideIcon };

export type IconProps = Omit<LucideProps, "size" | "ref"> &
  VariantProps<typeof iconStyles> &
  IconSource & {
    // 渡すと読み上げ対象になる。未指定なら装飾扱い（aria-hidden）
    label?: string;
  };

export function Icon({
  name,
  icon,
  size,
  label,
  className,
  ...props
}: IconProps) {
  const Source = icon ?? (name ? ICONS[name] : undefined);
  if (!Source) return null;

  return (
    <Source
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={iconStyles({ size, className })}
      {...props}
    />
  );
}

export default Icon;
