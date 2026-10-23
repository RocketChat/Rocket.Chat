import { render } from '@testing-library/react';

import { serializeCssUrl } from './serializeCssUrl';
import { Image } from '../blocks/ImageBlock.styles';
import { Element } from '../elements/ImageElement.styles';

const payload = `x);}body::after{content:"owned"}.z{x:url(`;

it.each([
	['https://example.test/image.png', 'url("https://example.test/image.png")'],
	['a"b', String.raw`url("a\"b")`],
	[String.raw`a\b`, String.raw`url("a\\b")`],
	['a\nb', String.raw`url("a\a b")`],
])('serializes %j as a quoted CSS URL', (input, expected) => {
	expect(serializeCssUrl(input)).toBe(expected);
});

it.each([
	['backspace', '\b', String.raw`\8 `],
	['tab', '\t', String.raw`\9 `],
	['newline', '\n', String.raw`\a `],
	['form feed', '\f', String.raw`\c `],
	['carriage return', '\r', String.raw`\d `],
	['unit separator', '\x1f', String.raw`\1f `],
])('preserves %s in a URL when CSS parses it', (_name, character, expectedEscape) => {
	const style = document.createElement('style');

	style.textContent = `.image { background-image: ${serializeCssUrl(`a${character}b`)}; }`;
	document.head.append(style);

	expect((style.sheet?.cssRules[0] as CSSStyleRule).style.cssText).toBe(`background-image: url("a${expectedEscape}b");`);

	style.remove();
});

it('does not let URL content create additional CSS rules', () => {
	const style = document.createElement('style');

	style.textContent = `.image { background-image: ${serializeCssUrl(payload)}; }`;
	document.head.append(style);

	expect(style.sheet?.cssRules).toHaveLength(1);
	expect((style.sheet?.cssRules[0] as CSSStyleRule).selectorText).toBe('.image');

	style.remove();
});

it.each([
	['image block', () => <Image imageUrl={payload} width={88} height={88} />],
	['image element', () => <Element imageUrl={payload} size={88} />],
])('does not create global selectors from an unsafe URL in the %s', (_name, createComponent) => {
	render(createComponent());

	// The CSSOM is the behavior under test.
	// eslint-disable-next-line testing-library/no-node-access
	const style = document.getElementById('rcx-styles') as HTMLStyleElement;
	const selectors = Array.from(style.sheet?.cssRules ?? []).flatMap((rule) => (rule instanceof CSSStyleRule ? [rule.selectorText] : []));

	expect(selectors).not.toContain('body::after');
	expect(selectors).not.toContain('.z');
});
