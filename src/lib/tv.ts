import { createTV, type VariantProps } from "tailwind-variants";

export const tv = createTV({
  twMerge: true,
  // Register custom text-* sizes as font-size so they don't collide with text color tokens
  twMergeConfig: {
    extend: {
      classGroups: {
        "font-size": [
          { text: ["highlight", "body", "compact", "label", "code"] },
        ],
      },
    },
  },
});

export type { VariantProps };
