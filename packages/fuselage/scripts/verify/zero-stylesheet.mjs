// Usage: node scripts/verify/zero-stylesheet.mjs <tamagui-zero.css>
// The zero-runtime compiler reports no bail for a value a frame cannot get: a token or theme key the config does not
// have is written as it was (`color:$typo`), and a theme key declared under another name than the one a frame reads has
// no value under a theme class. A zero build calls `zeroStylesheetErrors` on its stylesheet and fails on any.
import { readFileSync } from 'node:fs';

/** The `$name` references left in a stylesheet, each once. `[class$="x"]` is a selector, not a reference. */
export const unresolvedTokens = (css) => [...new Set(css.match(/\$[A-Za-z][\w.-]*/g) ?? [])];

/**
 * The theme keys a stylesheet does not declare as `--<key>`, the name a compiled frame reads, in the rule of the
 * theme's `t_*` class. `themes` is the config's; each result is `<theme>: <key>`.
 */
export const undeclaredThemeKeys = (css, themes) => {
	const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

	return Object.entries(themes).flatMap(([theme, keys]) => {
		const declared = new Set(
			rules
				.filter(([, selectors]) => selectors.split(',').some((selector) => selector.trim().endsWith(`.t_${theme}`)))
				.flatMap(([, , block]) => [...block.matchAll(/(--[\w-]+)\s*:/g)].map(([, name]) => name)),
		);

		return Object.keys(keys)
			.filter((key) => !declared.has(`--${key}`))
			.map((key) => `${theme}: ${key}`);
	});
};

/** Why a zero stylesheet cannot ship with the Tamagui config as it is, one message per kind of problem. */
export const zeroStylesheetErrors = async (css) => {
	// Node strips the types itself: a production install, which a build runs under, has no TypeScript loader.
	const { themes } = await import('../../src/tamagui.tokens.ts');
	const unresolved = unresolvedTokens(css);
	const undeclared = undeclaredThemeKeys(css, themes);

	return [
		unresolved.length && `Tokens the Tamagui config does not have: ${unresolved.join(', ')}`,
		undeclared.length && `Theme keys a theme class does not declare under the name a frame reads: ${undeclared.join(', ')}`,
	].filter(Boolean);
};

if (import.meta.filename === process.argv[1]) {
	const errors = await zeroStylesheetErrors(readFileSync(process.argv[2], 'utf8'));
	if (errors.length) {
		console.error(errors.join('\n'));
		process.exit(1);
	}
	console.log('Every token in the stylesheet resolved and every theme key is declared.');
}
