import typography from '@rocket.chat/fuselage-tokens/dist/typography.json';

const getTokenFontFamily = (name: keyof typeof typography.fontFamily): string =>
	typography.fontFamily[name].map((fontFace) => (fontFace.includes(' ') ? `'${fontFace}'` : fontFace)).join(', ');

export const sans = getTokenFontFamily('sans');
