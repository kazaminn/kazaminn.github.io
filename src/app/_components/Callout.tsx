import type { ReactNode } from "react";
import { Icon } from "@/app/_components/Icon";
import { CUSTOM_BLOCK_TYPES, type CustomBlockType } from "@/lib/constants";
import { tv } from "@/lib/tv";

export const calloutStyles = tv({
  slots: {
    root: "flex gap-3 rounded-card border p-4",
    icon: "mt-0.5",
    title: "font-bold",
    body: "text-base",
  },
  variants: {
    type: {
      NOTE: {
        root: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
        icon: "text-blue-600 dark:text-blue-400",
      },
      TIP: {
        root: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        icon: "text-green-600 dark:text-green-400",
      },
      IMPORTANT: {
        root: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100",
        icon: "text-purple-600 dark:text-purple-400",
      },
      WARNING: {
        root: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
        icon: "text-amber-600 dark:text-amber-400",
      },
      CAUTION: {
        root: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
        icon: "text-red-600 dark:text-red-400",
      },
    },
  },
  defaultVariants: { type: "NOTE" },
});

type CalloutProps = {
  type: CustomBlockType;
  children?: ReactNode;
};

export const Callout = ({ type, children }: CalloutProps) => {
  const block = CUSTOM_BLOCK_TYPES[type];
  const styles = calloutStyles({ type });

  return (
    <div className={styles.root()}>
      <Icon name={block.icon} size="lg" className={styles.icon()} />
      <div className="min-w-0">
        <p className={styles.title()}>{block.title}</p>
        <div className={styles.body()}>{children}</div>
      </div>
    </div>
  );
};

export default Callout;
