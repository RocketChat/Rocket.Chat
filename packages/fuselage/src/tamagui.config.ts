import { createTamagui, createTokens } from '@tamagui/web';

import { media, themes, tokens, webTokens } from './tamagui.tokens';

/** The one set of tokens and themes the web and native clients share. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens(process.env.TAMAGUI_TARGET === 'native' ? tokens : webTokens),
	themes,
	media,
	settings: { addThemeClassName: false },
});

export default tamaguiConfig;
