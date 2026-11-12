import { createTamagui, createTokens } from '@tamagui/web';

/** Colors and lengths stay on the `--rcx-*` custom properties, so palettes and custom themes keep reaching every component. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens({ color: {}, space: {}, size: {}, radius: {}, zIndex: {} }),
	themes: { light: {} },
	// A frame value names one as a key, as `{ default: 4, pointerCoarse: 12 }`, and zero compiles it to an `@media` rule.
	media: { pointerCoarse: { pointer: 'coarse' }, hoverNone: { hover: 'none' }, reducedMotion: { prefersReducedMotion: 'reduce' } },
	settings: { addThemeClassName: false },
});

export default tamaguiConfig;
