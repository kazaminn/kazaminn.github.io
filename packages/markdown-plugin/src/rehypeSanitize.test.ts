import type { Element, ElementContent, Root } from 'hast';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ALLOWED_TAGS,
  rehypeSanitize,
  type RehypeSanitizeOptions,
} from './rehypeSanitize';

const el = (
  tagName: string,
  properties: Element['properties'] = {},
  children: ElementContent[] = [],
): Element => ({ type: 'element', tagName, properties, children });

const text = (value: string): ElementContent => ({ type: 'text', value });

const run = (
  children: ElementContent[],
  options?: RehypeSanitizeOptions,
): ElementContent[] => {
  const tree: Root = { type: 'root', children };
  rehypeSanitize(options)(tree);
  return tree.children as ElementContent[];
};

describe('rehypeSanitize', () => {
  it('drops a script element and its content entirely', () => {
    const result = run([el('script', {}, [text('alert(1)')])]);
    expect(result).toEqual([]);
  });

  it('drops style, iframe and object too', () => {
    expect(run([el('style'), el('iframe'), el('object')])).toEqual([]);
  });

  it('keeps an allowed br element', () => {
    expect(run([el('br')])).toEqual([el('br')]);
  });

  it('keeps an anchor but strips a javascript: href', () => {
    const [node] = run([
      el('a', { href: 'javascript:alert(1)' }, [text('x')]),
    ]) as Element[];
    expect(node.tagName).toBe('a');
    expect(node.properties).not.toHaveProperty('href');
    expect(node.children).toEqual([text('x')]);
  });

  it('keeps a safe https href', () => {
    const [node] = run([
      el('a', { href: 'https://example.com' }, [text('x')]),
    ]) as Element[];
    expect(node.properties.href).toBe('https://example.com');
  });

  it('strips event handler attributes', () => {
    const [node] = run([el('p', { onClick: 'evil()', id: 'ok' })]) as Element[];
    expect(node.properties).not.toHaveProperty('onClick');
    expect(node.properties.id).toBe('ok');
  });

  it('preserves data- and aria- attributes on allowed elements', () => {
    const [node] = run([
      el('div', { dataCustomBlockType: 'NOTE', ariaLabel: 'note' }),
    ]) as Element[];
    expect(node.properties.dataCustomBlockType).toBe('NOTE');
    expect(node.properties.ariaLabel).toBe('note');
  });

  it('preserves className and inline style for syntax highlighting', () => {
    const [node] = run([
      el('span', { className: ['line'], style: 'color:#abc' }),
    ]) as Element[];
    expect(node.properties.className).toEqual(['line']);
    expect(node.properties.style).toBe('color:#abc');
  });

  it('unwraps an unknown element but keeps its children', () => {
    const result = run([el('string', {}, [text(' here')])]);
    expect(result).toEqual([text(' here')]);
  });

  it('recurses into children of allowed elements', () => {
    const [node] = run([
      el('p', {}, [text('a '), el('script', {}, [text('x')]), text('b')]),
    ]) as Element[];
    expect(node.children).toEqual([text('a '), text('b')]);
  });

  it('honors a caller-supplied allowlist extended from the defaults', () => {
    const options: RehypeSanitizeOptions = {
      allowedTags: [...DEFAULT_ALLOWED_TAGS, 'custom-tag'],
    };
    const [node] = run(
      [el('custom-tag', {}, [text('x')])],
      options,
    ) as Element[];
    expect(node.tagName).toBe('custom-tag');
  });

  it('lets the caller tighten the allowlist to drop a default tag', () => {
    const result = run([el('img', { src: 'https://cdn/x.png' })], {
      allowedTags: ['p'],
    });
    expect(result).toEqual([]);
  });
});
