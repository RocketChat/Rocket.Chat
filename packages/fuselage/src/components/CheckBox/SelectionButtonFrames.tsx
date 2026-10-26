import { styled, Text, View, type GetProps } from '@tamagui/web';

import { renderAs } from '../../helpers/renderAs';
import { toCSSValue } from '../../helpers/toCSSValue';
import { backgroundColor, borderWidth, fontColor, fontFamily, size, strokeColor } from '../../styleTokens';

// Restates what `rcx-box--full` gave these elements before they left `Box`
const boxDefaults = {
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

export const SelectionButtonLabel = styled(Text, {
	render: 'label',
	...boxDefaults,
	borderWidth: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	position: 'relative',
	display: 'inline-flex',
	verticalAlign: 'middle',
	cursor: 'pointer',
	outlineWidth: 0,
});

const SelectionButtonInputFrame = styled(View, {
	render: 'input',
	...boxDefaults,
	position: 'absolute',
	overflow: 'hidden',
	clip: 'rect(0, 0, 0, 0)',
	clipPath: 'inset(50%)',
	width: 1,
	height: 1,
	margin: -1,
	padding: 0,
	borderWidth: 0,
	whiteSpace: 'nowrap',
	flexShrink: 1,
});

// Tamagui adds `aria-disabled` next to a `disabled` prop; rendering the attribute directly keeps the input as it was
export const SelectionButtonInput = ({ disabled, render, ...props }: GetProps<typeof SelectionButtonInputFrame>) => (
	<SelectionButtonInputFrame {...props} render={disabled ? renderAs('input', { disabled: true }) : render} />
);

// The resting unchecked look; every other state is a sibling rule on the native input in each component's stylesheet
const restingColors = {
	empty: {
		color: toCSSValue('--rcx-button-empty-color', fontColor('white')),
		borderColor: toCSSValue('--rcx-button-empty-border-color', strokeColor('dark')),
		backgroundColor: toCSSValue('--rcx-button-empty-background-color', backgroundColor('light')),
	},
	off: {
		color: toCSSValue('--rcx-button-off-color', fontColor('white')),
		borderColor: toCSSValue('--rcx-button-off-border-color', strokeColor('medium')),
		backgroundColor: toCSSValue('--rcx-button-off-background-color', strokeColor('medium')),
	},
};

export const createSelectionButtonFake = (colors: keyof typeof restingColors) =>
	styled(View, {
		render: 'i',
		...boxDefaults,
		position: 'relative',
		height: size('x20'),
		borderWidth: borderWidth('default'),
		flexDirection: 'row',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		...restingColors[colors],
	});
