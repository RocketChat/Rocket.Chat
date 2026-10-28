import { styled, Text } from '@tamagui/web';

import { glyphColors } from './glyphColors';

export const IconFrame = styled(Text, {
	render: 'i',
	display: 'inline-block',
	flexShrink: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	userSelect: 'none',
	verticalAlign: 'text-bottom',
	letterSpacing: 0,
	fontFamily: 'RocketChat',
	// A caller's size travels as a custom property, so the frame's styles stay static and app CSS can still override them
	fontSize: 'var(--rcx-icon-size, inherit)',
	fontWeight: '400',
	fontStyle: 'normal',
	fontVariant: 'normal',
	lineHeight: '1',
	textRendering: 'auto',

	variants: {
		glyphColor: glyphColors,
	} as const,
});
