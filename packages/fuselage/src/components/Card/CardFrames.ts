import { styled, Text, View } from '@tamagui/web';

import { fontFamily, spacing } from '../../styleTokens';

/** Replaces a text-holding `Box` laid out as a flex row; its font scale stays a `Box` styling prop. */
export const CardText = styled(Text, {
	render: 'div',
	display: 'flex',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	gap: spacing('x8'),
});

/** A plain `div` laid out as a Card flex row or column. */
export const CardBlock = styled(View, {
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexShrink: 1,
	gap: spacing('x8'),

	variants: {
		row: {
			true: {
				flexDirection: 'row',
				alignItems: 'center',
			},
		},
	} as const,
});
