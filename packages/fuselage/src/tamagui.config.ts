import { createTamagui, createTokens } from '@tamagui/web';

/** Colors and lengths stay on the `--rcx-*` custom properties, so palettes and custom themes keep reaching every component. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens({ color: {}, space: {}, size: {}, radius: {}, zIndex: {} }),
	themes: { light: {} },
	settings: { addThemeClassName: false },
});
