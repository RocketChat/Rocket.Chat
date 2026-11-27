import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import primitives from '@rocket.chat/fuselage-tokens/dist/colors.json';

import PaletteStyleTag from './PaletteStyleTag';
import { tamaguiConfig } from '../../tamagui.config';
import { render } from '../../testing';
import { dark, highContrast, light } from './lib/themePalettes';

const styleOf = (id: string) => document.querySelector(`#${id}`)?.innerHTML ?? '';

/** The declarations of the one rule whose selector is given, by property. */
const declarationsOf = (css: string, selector: string) => {
	const start = css.indexOf(`${selector} {`);
	const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
	return Object.fromEntries(
		body
			.split(';')
			.filter((declaration) => declaration.trim())
			.map((declaration) => declaration.split(':').map((part) => part.trim())),
	);
};

/** What a compiled frame reads for each theme key of the Tamagui config: the custom property and the theme's color. */
const themeKeysOf = (theme: keyof typeof tamaguiConfig.themes) =>
	Object.fromEntries(
		Object.values(tamaguiConfig.themes[theme] as Record<string, { variable: string; val: string }>).map(({ variable, val }) => [
			variable.slice('var('.length, -1),
			val,
		]),
	);

describe('[PaletteStyleTag colors]', () => {
	it('creates the Light theme style tag', () => {
		render(<PaletteStyleTag theme='light' />);
		const style = document.querySelector('#main-palette');
		expect(style?.innerHTML).toContain(`surface-light: ${light['surface-light']}`);
	});
	it('creates the Dark theme style tag', () => {
		render(<PaletteStyleTag theme='dark' />);
		const style = document.querySelector('#main-palette');
		expect(style?.innerHTML).toContain(`surface-light: ${dark['surface-light']}`);
	});
	it('creates tag with the given id', () => {
		render(<PaletteStyleTag theme='light' tagId='test-palette' />);
		const style = document.querySelector('#test-palette');
		expect(style).not.toBeNull();
	});
	it('creates tag with the given prefix', () => {
		render(<PaletteStyleTag theme='light' prefix='--test' />);
		const style = document.querySelector('#main-palette');
		expect(style?.innerHTML).toContain(`--test-surface-light: ${light['surface-light']}`);
	});
	it('creates tag with the given selector', () => {
		render(<PaletteStyleTag theme='light' selector='.test' />);
		const style = document.querySelector('#main-palette');
		expect(style?.innerHTML).toContain('.test {');
	});
});

describe('[PaletteStyleTag theme keys]', () => {
	it.each([
		['light', light],
		['dark', dark],
		['high-contrast', highContrast],
	] as const)('writes every theme key of the Tamagui config for the %s theme, on the selector of the palette', (theme, palette) => {
		render(<PaletteStyleTag theme={theme} selector='.scope' tagId={`keys-${theme}`} />);

		const css = styleOf(`keys-${theme}`);
		const declarations = declarationsOf(css, '.scope');
		const themeKeys = themeKeysOf(theme);

		expect(css.match(/\{/g)).toHaveLength(1);
		expect(Object.keys(themeKeys)).toHaveLength(132);
		expect(declarations).toMatchObject(themeKeys);
		// A key the config does not have would be a property no frame reads
		expect(Object.keys(declarations)).toHaveLength(2 * Object.keys(palette).length);
	});

	it('gives the light theme the primitive the stylesheets fall back to, for each warning, secondary-warning and secondary-success button color', () => {
		const stylesheet = readFileSync(join(__dirname, '../../styles/colors.scss'), 'utf8');
		const fallbacks = [...stylesheet.matchAll(/^\t(on-)?([\w-]+): primitive\((\w+)\),?$/gm)]
			.filter(([, , name]) => /warning|secondary-success/.test(name))
			.map(([, font, name, grade]) => [`button-${font ? 'font-on' : 'background'}-${name}`, grade] as const);

		expect(fallbacks).toHaveLength(24);
		for (const [name, grade] of fallbacks) {
			expect([name, light[name]]).toEqual([name, primitives[grade as keyof typeof primitives]]);
		}
	});

	it('leaves the palette the stylesheets read as it was written before', () => {
		render(<PaletteStyleTag theme='dark' tagId='legacy-palette' />);

		const legacy = `:root {\n${Object.entries(dark)
			.map(([name, color]) => `--rcx-color-${name}: ${color};`)
			.join('\n')}\n`;

		expect(styleOf('legacy-palette').startsWith(legacy)).toBe(true);
	});

	it('repeats the colors of a custom palette under their theme keys, in the rule that sets them', () => {
		const palette = `.scope { --rcx-color-font-default: #aa0000; --rcx-color-status-font-on-service-2 : #00aa00; --rcx-color-mine: red }
.scope a { color: var(--rcx-color-font-default) }`;
		render(<PaletteStyleTag palette={palette} tagId='custom-palette' />);

		const css = styleOf('custom-palette');

		expect(declarationsOf(css, '.scope')).toEqual({
			'--rcx-color-font-default': '#aa0000',
			'--rcx-font-default': '#aa0000',
			'--rcx-color-status-font-on-service-2': '#00aa00',
			'--rcx-status-font-on-service-2': '#00aa00',
			'--rcx-color-mine': 'red',
		});
		expect(css).toContain('.scope a { color: var(--rcx-color-font-default) }');
	});

	it('gives the colors a custom palette leaves out the light theme, below any other palette', () => {
		render(<PaletteStyleTag theme='dark' palette=':root { --rcx-color-font-default: #aa0000 }' tagId='partial-palette' />);

		const css = styleOf('partial-palette');

		expect(declarationsOf(css, ':where(:root)')).toEqual(themeKeysOf('light'));
		expect(css.indexOf(':where(:root) {')).toBeLessThan(css.indexOf(':root { --rcx-color-font-default'));
	});

	it('leaves CSS that sets no palette color as it is', () => {
		const css = '.hljs { color: #c5c8c6; background: var(--rcx-color-surface-light) }';
		render(<PaletteStyleTag palette={css} tagId='other-css' />);

		expect(styleOf('other-css')).toBe(css);
	});
});
