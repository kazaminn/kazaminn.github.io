import type { Element, ElementContent, Root as HastRoot } from 'hast';

export const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'blockquote',
  'pre',
  'code',
  'span',
  'em',
  'strong',
  'del',
  's',
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'div',
  'figure',
  'figcaption',
  'sup',
  'sub',
  'kbd',
  'mark',
  'abbr',
  'details',
  'summary',
] as const;

export const DEFAULT_DROP_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'noscript',
  'template',
  'title',
  'svg',
  'math',
] as const;

export const DEFAULT_ALLOWED_ATTRIBUTES = [
  'className',
  'id',
  'style',
  'role',
  'title',
  'lang',
  'dir',
  'tabIndex',
  'align',
  'start',
  'reversed',
  'colSpan',
  'rowSpan',
  'scope',
  'alt',
  'width',
  'height',
  'target',
  'rel',
] as const;

export const DEFAULT_URL_PROTOCOLS: Record<string, readonly string[]> = {
  href: ['http', 'https', 'mailto', 'tel'],
  src: ['http', 'https'],
};

export type RehypeSanitizeOptions = {
  allowedTags?: Iterable<string>;
  dropTags?: Iterable<string>;
  allowedAttributes?: Iterable<string>;
  protocols?: Record<string, readonly string[]>;
};

const hasSafeProtocol = (
  value: string,
  allowed: readonly string[],
): boolean => {
  const colon = value.indexOf(':');
  if (colon === -1) return true;

  const slash = value.indexOf('/');
  const question = value.indexOf('?');
  const hash = value.indexOf('#');

  const schemeEndsFirst =
    (slash === -1 || colon < slash) &&
    (question === -1 || colon < question) &&
    (hash === -1 || colon < hash);
  if (!schemeEndsFirst) return true;

  return allowed.includes(value.slice(0, colon).toLowerCase());
};

export const rehypeSanitize =
  (options: RehypeSanitizeOptions = {}) =>
  (tree: HastRoot): void => {
    const allowedTags = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
    const dropTags = new Set(options.dropTags ?? DEFAULT_DROP_TAGS);
    const allowedAttributes = new Set(
      options.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES,
    );
    const protocols = options.protocols ?? DEFAULT_URL_PROTOCOLS;

    const isAttributeAllowed = (name: string): boolean => {
      if (/^on/i.test(name)) return false;
      if (name.startsWith('data') || name.startsWith('aria')) return true;
      if (Object.hasOwn(protocols, name)) return true;
      return allowedAttributes.has(name);
    };

    const sanitizeProperties = (node: Element): Element['properties'] => {
      const result: Element['properties'] = {};

      for (const [name, value] of Object.entries(node.properties)) {
        if (!isAttributeAllowed(name)) continue;

        if (Object.hasOwn(protocols, name) && typeof value === 'string') {
          if (!hasSafeProtocol(value, protocols[name])) continue;
        }

        result[name] = value;
      }

      return result;
    };

    const sanitizeElement = (node: Element): ElementContent[] => {
      if (dropTags.has(node.tagName)) return [];

      const children = node.children.flatMap(sanitizeContent);

      if (!allowedTags.has(node.tagName)) return children;

      node.properties = sanitizeProperties(node);
      node.children = children;
      return [node];
    };

    const sanitizeContent = (node: ElementContent): ElementContent[] => {
      if (node.type === 'element') return sanitizeElement(node);
      if (node.type === 'text') return [node];
      return [];
    };

    tree.children = tree.children.flatMap((child) =>
      child.type === 'element'
        ? sanitizeElement(child)
        : child.type === 'text'
          ? [child]
          : [],
    );
  };
