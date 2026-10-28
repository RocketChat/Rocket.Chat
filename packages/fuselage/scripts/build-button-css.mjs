// Writes `src/components/Button/Button.variants.css`: the Button and IconButton variants as plain CSS, from the same
// style objects `ButtonFrame.tsx` holds, so the frames lower to one static class list with no per-variant table.
// Usage: node scripts/build-button-css.mjs [--check]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const target = resolve(root, 'src/components/Button/Button.variants.css');

const result = await build({
	entryPoints: [resolve(root, 'src/components/Button/ButtonFrame.tsx')],
	bundle: true,
	write: false,
	platform: 'node',
	format: 'cjs',
	logLevel: 'silent',
});
const module = { exports: {} };
new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { buttonVariantStyles: v, paintStrategy } = module.exports;

const kebab = (name) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
// Tamagui's state keys, in the order its atomic rules are emitted: the last matching state wins
const states = { 'default': '', 'hover': ':where(:hover)', 'focus-visible': ':where(:focus-visible)', 'press': ':where(:active)' };

/** One rule per state a style sets, `default` first, like Tamagui's atomic rules. */
const rules = (selector, style) =>
	Object.entries(states)
		.map(([state, pseudo]) => {
			const declarations = Object.entries(style).flatMap(([property, value]) => {
				const stateValue = typeof value === 'object' && value !== null ? value[state] : state === 'default' ? value : undefined;
				return stateValue === undefined ? [] : [`${kebab(property)}:${stateValue}`];
			});
			return declarations.length ? `${selector.split(',').map((part) => `${part.trim()}${pseudo}`).join(',')}{${declarations.join(';')}}` : '';
		})
		.join('');

// IconButton's variant class names the kind it paints with
const iconVariantKinds = {
	'secondary': 'secondary',
	'info': 'icon-info',
	'success': 'icon-success',
	'warning': 'icon-warning',
	'danger': 'icon-danger',
	'secondary-info': 'primary',
	'secondary-success': 'success',
	'secondary-warning': 'warning',
	'secondary-danger': 'danger',
};
const buttonKinds = ['primary', 'secondary', 'danger', 'warning', 'success', 'secondary-danger', 'secondary-warning', 'secondary-success'];
const pressableVariants = { '': 'icon', 'info': 'icon-info', 'success': 'icon-success', 'warning': 'icon-warning', 'danger': 'icon-danger' };

// Specificity (0,2,0) and up beats the frame's own atomic classes (0,1,0); within a level, later rules win
const sizing = [
	...Object.entries(v.sizes).map(([size, style]) => rules(`.rcx-button.rcx-button--${size}`, style)),
	rules('.rcx-button.rcx-button--compact', v.compact),
	rules('.rcx-button.rcx-button--square', v.square),
	...Object.entries(v.squareSizes).map(([size, style]) => rules(`.rcx-button.rcx-button--${size}-square`, style)),
	rules('.rcx-button.rcx-button--with-badge', v.withBadge),
];

const classPaint = () => [
	...buttonKinds.map((kind) => rules(`.rcx-button.rcx-button--${kind}`, v.looks[kind])),
	rules('.rcx-button.rcx-button--icon', v.looks.icon),
	...Object.entries(iconVariantKinds).map(([variant, kind]) => rules(`.rcx-button.rcx-button--icon-${variant}`, v.looks[kind])),
	...Object.entries(pressableVariants).map(([variant, kind]) =>
		rules(`.rcx-button.rcx-button--icon-${variant}-pressed`, v.looks[`${kind}-pressed`]),
	),
	// Disabled wins over the kind and pressed rules in every state
	rules('.rcx-button:not(.rcx-button--icon)[disabled]', v.looks['secondary-disabled']),
	...buttonKinds.map((kind) => rules(`.rcx-button.rcx-button--${kind}[disabled]`, v.looks[`${kind}-disabled`])),
	rules('.rcx-button.rcx-button--icon[disabled]', v.looks['icon-disabled']),
	...Object.entries(iconVariantKinds).map(([variant, kind]) =>
		rules(`.rcx-button.rcx-button--icon-${variant}[disabled]`, v.looks[`${kind}-disabled`]),
	),
	// Ghost colors win over disabled ones, and the glyph color over everything
	...Object.entries(v.ghosts).map(([kind, style]) => rules(`.rcx-button.rcx-button--ghost.rcx-button--ghost-${kind}`, style)),
	...Object.entries(v.glyphColors).map(([color, style]) => rules(`.rcx-button.rcx-button--glyph.rcx-button--glyph-${color}`, style)),
];

const dataPaint = () => [
	...Object.entries(v.looks).map(([look, style]) => rules(`.rcx-button[data-look="${look}"]`, style)),
	...Object.entries(v.ghosts).map(([kind, style]) => rules(`.rcx-button[data-ghost="${kind}"]`, style)),
	...Object.entries(v.glyphColors).map(([color, style]) => rules(`.rcx-button[data-glyph="${color}"]`, style)),
];

/** Each layer's values as its own custom properties, which the frame's static styles read in precedence order. */
const varPaint = () => {
	const assign = (layer, style) =>
		Object.fromEntries(
			Object.entries(style).flatMap(([property, value]) =>
				Object.keys(states)
					.map((state) => [state, typeof value === 'object' && value !== null ? value[state] : state === 'default' ? value : undefined])
					.filter(([, stateValue]) => stateValue !== undefined)
					.map(([state, stateValue]) => [v.paintVar(layer, property, state), stateValue]),
			),
		);
	const declare = (selector, values) => `${selector}{${Object.entries(values).map(([name, value]) => `${name}:${value}`).join(';')}}`;
	const names = new Set();
	const out = [
		...Object.entries(v.looks).map(([look, style]) => declare(`.rcx-button[data-look="${look}"]`, assign('look', style))),
		...Object.entries(v.ghosts).map(([kind, style]) => declare(`.rcx-button[data-ghost="${kind}"]`, assign('ghost', style))),
		...Object.entries(v.glyphColors).map(([color, style]) => declare(`.rcx-button[data-glyph="${color}"]`, assign('glyph', style))),
	];
	for (const block of out) for (const [, name] of block.matchAll(/(--rcx-button-[\w-]+):/g)) names.add(name);
	// Unregistered custom properties inherit, so a button nested in another would take its parent's colors
	registered.push(...[...names].sort().map((name) => `@property ${name}{syntax:'*';inherits:false}`));
	return out;
};

// `@property` rules stay outside the layer
const registered = [];
const paint = { class: classPaint, data: dataPaint, vars: varPaint }[paintStrategy];
const layered = [...sizing, ...paint()].filter(Boolean).join('\n');
const css = `/* Generated by scripts/build-button-css.mjs from ButtonFrame.tsx; do not edit */\n${registered.map((rule) => `${rule}\n`).join('')}@layer fuselage {\n${layered}\n}\n`;

if (process.argv.includes('--check')) {
	if (readFileSync(target, 'utf8') !== css) {
		console.error('src/components/Button/Button.variants.css is stale: run node scripts/build-button-css.mjs');
		process.exit(1);
	}
} else {
	writeFileSync(target, css);
	console.log(`wrote ${target} (${css.length} chars, ${paintStrategy} paint)`);
}
