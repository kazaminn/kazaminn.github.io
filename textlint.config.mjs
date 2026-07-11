import { createBaseConfig } from "@kazamitte/textlint-config/base";

// Flat-config style: export the descriptor to lint with. Swap options here, or
// export an array of descriptors to merge several (left-to-right).
export default createBaseConfig({
  style: "ja-technical-writing",
  aiWriting: false,
  spacing: true,
  rules: {
    "preset-ja-spacing": {
      "ja-nakaguro-or-halfwidth-space-between-katakana": true,
      "ja-no-space-around-parentheses": true,
      "ja-no-space-around-slash": true,
      "ja-no-space-between-full-width": true,
      "ja-space-after-exclamation": false,
      "ja-space-after-question": false,
      "ja-space-around-code": {
        before: false,
        after: false,
      },
      "ja-space-around-emphasis": {
        before: false,
        after: false,
      },
      "ja-space-around-link": {
        before: false,
        after: false,
      },
      "ja-space-around-strong": {
        before: false,
        after: false,
      },
      "ja-space-between-half-and-full-width": {
        lintStyledNode: true,
        space: "never",
      },
    },
    "preset-ja-technical-writing": {
      "no-mix-dearu-desumasu": {
        preferInBody: "",
        preferInHeader: "",
        preferInList: "",
      },
      "sentence-length": false,
      "max-kanji-continuous-len": {
        max: 10,
      },
      "no-exclamation-question-mark": false,
      "ja-no-weak-phrase": false,
      "ja-no-mixed-period": {
        periodMark: "。",
        allowPeriodMarks: [":"],
        allowEmojiAtEnd: false,
        forceAppendPeriod: false,
      },
    },
  },
});
