import { fontScale, themes, tokens } from '../../../../packages/fuselage/src/tamagui.tokens.ts';

export type ComposerTheme = 'light' | 'dark';

// The names are the ones the web composer's Box props and the input-box stylesheet resolve; the values come from
// @rocket.chat/fuselage-tokens through Fuselage's generated native tokens, never copied by hand
export function composerTokens(theme: ComposerTheme = 'light') {
	const palette = themes[theme];
	return {
		stroke: { light: palette['rcx-stroke-light'] },
		surface: { light: palette['rcx-surface-light'], neutral: palette['rcx-surface-neutral'] },
		font: {
			default: palette['rcx-font-default'],
			annotation: palette['rcx-font-annotation'],
			disabled: palette['rcx-font-disabled'],
		},
		radius: { medium: tokens.radius.medium },
		borderWidth: 1,
		space: tokens.space,
		size: tokens.size,
		fontScale,
	};
}

export type ComposerTokens = ReturnType<typeof composerTokens>;
