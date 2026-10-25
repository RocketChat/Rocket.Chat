import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { ButtonHTMLAttributes } from 'react';
import { useContext } from 'react';

import { TabsContext, tabsBoxStyle } from './Tabs';
import { statusBackgroundColors, strokeColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSColorValue, toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontScale, size, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const h4 = fontScale('h4');

const hoverColor = toCSSValue('--rcx-tabs-hover-border-color', textIconColors['font-default']);
const activeColor = toCSSValue('--rcx-tabs-active-color', textIconColors['font-titles-labels']);
const focusBorderColor = toCSSValue(
	'--rcx-tabs-focus-border-color',
	toCSSColorValue('button-background-primary-default', button.light.backgroundPrimaryDefault),
);
const selectedColor = toCSSValue('--rcx-tabs-selected-color', textIconColors['font-info']);
const selectedBorderColor = toCSSValue('--rcx-tabs-selected-border-color', textIconColors['font-info']);
const hoverSelectedPrimary = toCSSColorValue('button-background-primary-hover', button.light.backgroundPrimaryHover);
const activeSelectedPrimary = toCSSColorValue('button-background-primary-press', button.light.backgroundPrimaryPress);
const disabledColor = toCSSValue('--rcx-tabs-disabled-color', textIconColors['font-disabled']);
const disabledSelectedColor = toCSSValue('--rcx-tabs-disabled-selected-color', statusBackgroundColors['status-background-info']);
const disabledSelectedBorderColor = toCSSValue(
	'--rcx-tabs-disabled-selected-border-color',
	statusBackgroundColors['status-background-info'],
);
const sideBorderColor = { 'default': 'transparent', 'focus-visible': focusBorderColor };

// The block-end border is the tab's underline; a divider pins its width, as the stylesheet's last rule did
const schemeStyle = (selected: boolean, disabled: boolean, divider: boolean) => {
	const underlineWidth =
		divider || selected
			? borderWidth('default')
			: { default: borderWidth('default'), hover: borderWidth('large'), press: borderWidth('large') };

	if (selected && disabled) {
		return { color: disabledSelectedColor, borderBottomColor: disabledSelectedBorderColor, borderBottomWidth: underlineWidth };
	}

	if (selected) {
		return {
			color: {
				default: selectedColor,
				hover: toCSSValue('--rcx-tabs-hover-selected-color', hoverSelectedPrimary),
				press: toCSSValue('--rcx-tabs-active-selected-color', activeSelectedPrimary),
			},
			borderBottomColor: {
				default: selectedBorderColor,
				hover: toCSSValue('--rcx-tabs-hover-selected-border-color', hoverSelectedPrimary),
				press: toCSSValue('--rcx-tabs-active-selected-border-color', activeSelectedPrimary),
			},
			borderBottomWidth: underlineWidth,
		};
	}

	return {
		color: disabled
			? disabledColor
			: { default: toCSSValue('--rcx-tabs-color', textIconColors['font-hint']), hover: hoverColor, press: activeColor },
		borderBottomColor: { 'default': 'transparent', 'hover': hoverColor, 'press': activeColor, 'focus-visible': focusBorderColor },
		borderBottomWidth: underlineWidth,
	};
};

const schemes = Object.fromEntries(
	[false, true].flatMap((selected) =>
		[false, true].flatMap((disabled) =>
			[false, true].map((divider) => [`${selected}:${disabled}:${divider}`, schemeStyle(selected, disabled, divider)]),
		),
	),
);

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
	borderTopColor: sideBorderColor,
	borderLeftColor: sideBorderColor,
	borderRightColor: sideBorderColor,
	borderRadius: {
		'focus-visible': toCSSValue('--rcx-tabs-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	},
	boxShadow: {
		'focus-visible': `0 0 0 ${borderWidth('medium')} ${toCSSValue('--rcx-tabs-focus-shadow-color', strokeColors['stroke-extra-light-highlight'])}`,
	},
	backgroundColor: 'transparent',
	cursor: 'pointer',
	fontSize: h4.fontSize,
	fontWeight: String(h4.fontWeight) as '700',
	lineHeight: h4.lineHeight,
	letterSpacing: h4.letterSpacing,

	variants: {
		scheme: schemes,
		selected: {
			true: { paddingBlock: spacing('x4') },
		},
		divider: {
			true: { marginBlockEnd: `-${borderWidth('default')}` },
		},
		stretch: {
			true: { flexGrow: 1, textAlign: 'center' },
		},
		// Not `disabled`, which Tamagui would also turn into an `aria-disabled` attribute
		isDisabled: {
			true: {
				cursor: 'not-allowed',
			},
		},
	} as const,
});

export type TabsItemProps = ElementProps<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>> & {
	selected?: boolean;
	disabled?: boolean;
};

function TabsItem({ selected, disabled, className, ...props }: TabsItemProps) {
	const { divider, stretch } = useContext(TabsContext);

	return (
		<TabsItemFrame
			{...{ scheme: `${!!selected}:${!!disabled}:${divider}` }}
			selected={selected}
			divider={divider}
			stretch={stretch}
			isDisabled={disabled}
			{...(className?.split(/\s+/).includes('disabled') && { cursor: 'not-allowed' })}
			{...({ 'aria-selected': selected ? 'true' : 'false', 'role': 'tab', ...props } as GetProps<typeof TabsItemFrame>)}
			className={cx(
				'rcx-tabs__item',
				selected && 'rcx-tabs__item--selected',
				disabled && 'rcx-tabs__item--disabled',
				selected && disabled && 'rcx-tabs__item--selected--disabled',
				className,
			)}
		/>
	);
}

export default withFuselageProvider(TabsItem);
