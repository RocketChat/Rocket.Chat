import { createTamagui, createTokens } from '@tamagui/web';

import { themes, tokens } from './tamagui.tokens';

/** The one set of tokens and themes the web and native clients share. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens(tokens),
	themes,
	settings: { addThemeClassName: false },
});

export default tamaguiConfig;
