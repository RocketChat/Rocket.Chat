import { createTamagui, createTokens } from '@tamagui/web';

import { themes, tokens, webTokens } from './tamagui.tokens';

/** The one set of tokens and themes the web and native clients share. */
export const tamaguiConfig = createTamagui({
	tokens: createTokens(process.env.TAMAGUI_TARGET === 'native' ? tokens : webTokens),
	themes,
	// The `sm` and `md` breakpoints of `@rocket.chat/fuselage-tokens`. A frame value names one as a key, `{ default, sm, md }`
	media: { sm: { minWidth: 600 }, md: { minWidth: 768 } },
	settings: { addThemeClassName: false },
});

export default tamaguiConfig;
