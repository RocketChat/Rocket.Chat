import { styled, Text, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import { tabsBoxStyle } from './Tabs';
import { textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { borderWidth, fontScale, size, spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const h4 = fontScale('h4')!;

const TabsItemFrame = styled(Text, {
	render: 'button',
	...tabsBoxStyle,
	display: 'inline-block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	position: 'relative',
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 0,
	minHeight: size('x40'),
	marginBlock: 0,
	marginInline: spacing('x12'),
	paddingBlock: `calc(${spacing('x4')} + ${borderWidth('default')})`,
	paddingInline: 0,
	color: toCSSValue('--rcx-tabs-color', textIconColors['font-hint']),
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: 'transparent',
	backgroundColor: 'transparent',
	cursor: 'pointer',
	fontSize: h4.fontSize,
	fontWeight: String(h4.fontWeight) as '700',
	lineHeight: h4.lineHeight,
	letterSpacing: h4.letterSpacing,

	variants: {
		// Not `disabled`, which Tamagui would also turn into an `aria-disabled` attribute
		isDisabled: {
			true: {
				cursor: 'not-allowed',
				color: toCSSValue('--rcx-tabs-disabled-color', textIconColors['font-disabled']),
			},
		},
	} as const,
});

export type TabsItemProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLButtonElement> & {
		selected?: boolean;
		disabled?: boolean;
	};

function TabsItem({ selected, disabled, ...props }: TabsItemProps) {
	const itemProps = useTamaguiBoxProps({
		'is': 'button',
		'rcx-tabs__item': true,
		'rcx-tabs__item--selected': selected,
		'rcx-tabs__item--disabled': disabled,
		'rcx-tabs__item--selected--disabled': selected && disabled,
		'aria-selected': selected ? 'true' : 'false',
		'role': 'tab',
		...props,
	});

	return <TabsItemFrame isDisabled={disabled} {...(itemProps as GetProps<typeof TabsItemFrame>)} />;
}

export default withFuselageProvider(TabsItem);
