import tokenBorder from '@rocket.chat/fuselage-tokens/dist/border.json';
import breakpoints from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import { createTamagui, createTokens } from '@tamagui/web';

import { borderRadius, size, spacing } from './styleTokens';
// Before any frame inserts its `fuselage` sheet
import './styles/layerOrder';

// Same queries the SCSS `on-breakpoint` mixin emitted, so `sm:`-style clauses switch at the same widths
const media = Object.fromEntries(
	Object.entries(breakpoints)
		.filter(([, { minViewportWidth }]) => minViewportWidth !== null)
		.map(([name, { minViewportWidth }]) => [name, { minWidth: `${minViewportWidth! / 16}em` }]),
);

// Each token becomes a `:root` custom property, so only `x0`-`x64` and the larger measures Rocket.Chat uses are tokens;
// `useTamaguiBoxProps` resolves any other `x<n>` itself
// ponytail: hand-picked list, generate it from a usage scan if it drifts
const largeMeasures = [80, 96, 100, 104, 108, 112, 120, 140, 144, 150, 160, 180, 200, 208, 215, 220, 224, 240, 256, 260, 276, 280, 300, 320, 332, 340, 360, 400, 460, 480, 516, 540, 580, 600, 608, 622, 640, 800, 1200];
export const measureTokenSteps = new Set([...Array.from({ length: 65 }, (_, n) => n), ...largeMeasures]);

/** The `x<n>` grammar (but `none`, a reserved CSS keyword Tamagui won't take as a token name) `Box` styling props accept, as Tamagui tokens resolving to the same values `spacing()` and `size()` return. */
const measures = (resolve: (value: string) => string | undefined, extra: string[]) =>
	Object.fromEntries(
		[
			...extra,
			...[...measureTokenSteps].flatMap((n) => [`x${n}`, `neg-x${n}`, `-x${n}`]),
		].map((name) => [name, resolve(name)!]),
	);

/** Colors stay on the `--rcx-*` custom properties, so palettes and custom themes keep reaching every component. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens({
		color: {},
		space: measures(spacing, []),
		size: measures(size, ['full', 'sw', 'sh']),
		radius: Object.fromEntries(Object.keys(tokenBorder.radius).filter((name) => name !== 'none').map((name) => [name, borderRadius(name)!])),
		zIndex: {},
	}),
	themes: { light: {} },
	media,
	settings: { addThemeClassName: false },
});
