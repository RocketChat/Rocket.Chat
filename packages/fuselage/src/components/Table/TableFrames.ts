import { styled, Text, View } from '@tamagui/web';

import { surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale, spacing } from '../../styleTokens';

/** What `rcx-box rcx-box--full` used to give every Table element. */
const tableBoxStyle = {
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	margin: 0,
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
} as const;

const toFontStyle = (name: 'p2' | 'c2') => {
	const scale = fontScale(name)!;

	return {
		fontSize: scale.fontSize,
		fontWeight: String(scale.fontWeight) as '400',
		lineHeight: scale.lineHeight,
		letterSpacing: scale.letterSpacing,
	};
};

export const TableWrapper = styled(View, {
	...tableBoxStyle,
	display: 'block',
	position: 'relative',
});

export const TableFrame = styled(View, {
	render: 'table',
	...tableBoxStyle,
	display: 'table',
	width: '100%',
	borderSpacing: `0 ${spacing('x2')}`,
	borderCollapse: 'collapse',

	variants: {
		fixed: {
			true: {
				tableLayout: 'fixed',
			},
		},
	} as const,
});

export const TableHeadFrame = styled(View, {
	render: 'thead',
	...tableBoxStyle,
	display: 'table-header-group',
});

export const TableBodyFrame = styled(View, {
	render: 'tbody',
	...tableBoxStyle,
	display: 'table-row-group',
});

export const TableFootFrame = styled(View, {
	render: 'tfoot',
	...tableBoxStyle,
	display: 'table-footer-group',
});

export const TableRowFrame = styled(View, {
	render: 'tr',
	...tableBoxStyle,
	display: 'table-row',

	variants: {
		selected: {
			true: {
				backgroundColor: String(surfaceColors['surface-tint']),
			},
		},
	} as const,
});

export const TableCellFrame = styled(Text, {
	render: 'td',
	...tableBoxStyle,
	display: 'table-cell',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	padding: spacing('x8'),
	userSelect: 'text',
	textAlign: 'unset',
	verticalAlign: 'middle',
	color: String(textIconColors['font-secondary-info']),
	...toFontStyle('p2'),

	variants: {
		header: {
			true: {
				position: 'relative',
				...toFontStyle('c2'),
			},
		},
		clickable: {
			true: {
				cursor: 'pointer',
			},
		},
		align: {
			start: { textAlign: 'start' },
			end: { textAlign: 'end' },
			center: { textAlign: 'center' },
			justify: { textAlign: 'justify' },
		},
	} as const,
});

export const TableSelectionFrame = styled(View, {
	...tableBoxStyle,
	flexDirection: 'row',
	color: String(textIconColors['font-titles-labels']),
	borderRadius: toCSSValue('--rcx-table-selected-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!)),
	backgroundColor: String(surfaceColors['surface-neutral']),
});
