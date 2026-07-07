import { describe, expect, it } from 'vitest';
import { normalizeText } from './normalizeText';

describe('normalizeText', () => {
  it('escapes a less-than used as comparison', () => {
    expect(normalizeText('when a < b holds')).toBe('when a \\< b holds');
  });

  it('escapes a less-than followed by a digit', () => {
    expect(normalizeText('0 <3 heart')).toBe('0 \\<3 heart');
  });

  it('leaves a real HTML tag alone so sanitize can allowlist it', () => {
    expect(normalizeText('a<br>b and <a href="/x">y</a>')).toBe(
      'a<br>b and <a href="/x">y</a>',
    );
  });

  it('leaves a closing tag and an HTML comment alone', () => {
    expect(normalizeText('text </span> <!-- note -->')).toBe(
      'text </span> <!-- note -->',
    );
  });

  it('does not convert br or anchors to markdown anymore', () => {
    expect(normalizeText('x<br/>y')).toBe('x<br/>y');
  });

  it('does not touch `<` inside an inline code span', () => {
    expect(normalizeText('use `a < b` here')).toBe('use `a < b` here');
  });

  it('keeps a fenced code block verbatim', () => {
    const input = ['```ts', 'type T = Array<string>;', '```'].join('\n');
    expect(normalizeText(input)).toBe(input);
  });

  it('keeps a tilde-fenced code block verbatim', () => {
    const input = ['~~~', 'a < b', '~~~'].join('\n');
    expect(normalizeText(input)).toBe(input);
  });

  it('keeps an indented (4-space) code block verbatim', () => {
    expect(normalizeText('    type T = A < b;')).toBe('    type T = A < b;');
  });

  it('passes shortcodes through unchanged', () => {
    const input = '[[demo key="button" type="outline"]]';
    expect(normalizeText(input)).toBe(input);
  });

  it('preserves a blockquote prefix while escaping its body', () => {
    expect(normalizeText('> a < b here')).toBe('> a \\< b here');
  });

  it('leaves an already backslash-escaped less-than untouched', () => {
    expect(normalizeText('a \\< b')).toBe('a \\< b');
  });
});
