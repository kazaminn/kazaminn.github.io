const QUOTE_PREFIX_RE = /^((?: {0,3}>[ \t]?)*)(.*)$/;
const FENCE_RE = /^( {0,3})(`{3,}|~{3,})/;
const INDENTED_CODE_RE = /^(?: {4}|\t)/;
const INLINE_CODE_RE = /(`+)([\s\S]*?)\1/g;

const BARE_LT_RE = /(?<!\\)<(?![A-Za-z/!?])/g;

type Fence = {
  marker: '`' | '~';
  length: number;
  quotePrefix: string;
};

const splitQuotePrefix = (
  line: string,
): [quotePrefix: string, body: string] => {
  const match = QUOTE_PREFIX_RE.exec(line);
  return [match?.[1] ?? '', match?.[2] ?? line];
};

const getFence = (body: string): Omit<Fence, 'quotePrefix'> | undefined => {
  const match = FENCE_RE.exec(body);
  if (!match) return undefined;

  const fence = match[2];

  return {
    marker: fence[0] as '`' | '~',
    length: fence.length,
  };
};

const isFenceClose = (body: string, fence: Fence): boolean =>
  new RegExp(`^ {0,3}${fence.marker}{${fence.length},}\\s*$`).test(body);

const escapeText = (text: string): string => text.replace(BARE_LT_RE, '\\<');

const escapeInlineCodeAware = (line: string): string => {
  let result = '';
  let lastIndex = 0;

  for (const match of line.matchAll(INLINE_CODE_RE)) {
    const index = match.index ?? 0;

    result += escapeText(line.slice(lastIndex, index));
    result += match[0];

    lastIndex = index + match[0].length;
  }

  result += escapeText(line.slice(lastIndex));

  return result;
};

export const normalizeText = (content: string): string => {
  const out: string[] = [];
  let fence: Fence | undefined;

  for (const line of content.split('\n')) {
    const [quotePrefix, body] = splitQuotePrefix(line);

    if (fence) {
      out.push(line);

      if (quotePrefix === fence.quotePrefix && isFenceClose(body, fence)) {
        fence = undefined;
      }

      continue;
    }

    const nextFence = getFence(body);
    if (nextFence) {
      fence = {
        ...nextFence,
        quotePrefix,
      };

      out.push(line);
      continue;
    }

    if (INDENTED_CODE_RE.test(body)) {
      out.push(line);
      continue;
    }

    out.push(`${quotePrefix}${escapeInlineCodeAware(body)}`);
  }

  return out.join('\n');
};
