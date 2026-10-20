import breakpoints from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import { createTamagui, createTokens } from '@tamagui/web';

// Same queries the SCSS `on-breakpoint` mixin emitted, so `sm:`-style clauses switch at the same widths
const media = Object.fromEntries(
	Object.entries(breakpoints)
		.filter(([, { minViewportWidth }]) => minViewportWidth !== null)
		.map(([name, { minViewportWidth }]) => [name, { minWidth: `${minViewportWidth! / 16}em` }]),
);

/** Colors and lengths stay on the `--rcx-*` custom properties, so palettes and custom themes keep reaching every component. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens({ color: {}, space: {}, size: {}, radius: {}, zIndex: {} }),
	themes: { light: {} },
	media,
	settings: { addThemeClassName: false },
});
