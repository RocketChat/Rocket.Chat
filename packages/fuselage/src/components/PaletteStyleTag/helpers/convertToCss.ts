// The key carries the `rcx-` prefix itself: Tamagui cannot prefix theme keys when it compiles to zero runtime.
/** The theme key a Tamagui frame reads a palette color by. */
export const themeKey = (name: string) => `rcx-${name.trim()}`;

const themeKeyDeclarations = (values: Record<string, string>) =>
	Object.entries(values)
		.map(([name, color]) => `--${themeKey(name)}: ${color};`)
		.join('\n');

/** One rule that gives a palette to both readers: the stylesheets, under `prefix`, and the Tamagui frames, under the theme keys. */
export const convertToCss = (values: Record<string, string>, prefix: string, selector = ':root') =>
	`${selector} {\n${Object.entries(values)
		.map(([name, color]) => `${prefix}-${name}: ${color};`)
		.join('\n')}\n${themeKeyDeclarations(values)}\n}`;

/**
 * A custom palette with each color it sets repeated under its theme key, in the same rule. The colors it leaves out take
 * `fallback` at no specificity, as the stylesheets fall back to the light theme, so no frame is left without a color and
 * any other palette on the page still wins. CSS that sets no palette color is returned as it is.
 */
export const withThemeKeys = (css: string, prefix: string, fallback: Record<string, string>) => {
	const names = new Set(Object.keys(fallback).map((name) => name.trim()));
	const declaration = new RegExp(`${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-([\\w-]+)(\\s*:[^;}]+)`, 'g');
	const mirrored = css.replace(declaration, (written, name: string, value: string) =>
		names.has(name) ? `${written};--${themeKey(name)}${value}` : written,
	);

	return mirrored === css ? css : `:where(:root) {\n${themeKeyDeclarations(fallback)}\n}\n${mirrored}`;
};
