import { styled, Text, View, type GetProps } from '@tamagui/web';

import { renderAs } from '../../helpers/renderAs';
import { borderWidth, fontFamily, size } from '../../styleTokens';

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

export const SelectionButtonFake = styled(View, {
	render: 'i',
	...boxDefaults,
	position: 'relative',
	height: size('x20'),
	borderWidth: borderWidth('default'),
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});
