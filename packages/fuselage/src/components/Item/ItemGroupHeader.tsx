import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { itemColorFontSecondary, itemRowStyle, toRender, textStyle } from './itemStyles';
import type { ItemInset } from './types';
import { surfaceColors } from '../../Theme';
import { cx, cxx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// Hover and focus follow the title through `:has`, so they stay in SCSS.
const ItemGroupHeaderFrame = styled(Text, {
	...itemRowStyle,
	minHeight: size('x28'),
	color: itemColorFontSecondary,
	...textStyle('c2'),

	variants: {
		sticky: {
			true: {
				position: 'sticky',
				zIndex: 2,
				top: 0,
				backgroundColor: toCSSValue('--rcx-item-group-header-color-surface', surfaceColors['surface-light']),
			},
		},
	} as const,
});

export type ItemGroupHeaderProps = {
	/**
	 * The element to render. Inside an `ItemGroup` rendered as `ul`, pass `li` with `aria-hidden`:
	 * the title still names the list, and the list reports only its rows.
	 * A header with interactive content, such as a collapse button, goes outside the list.
	 */
	is?: ElementType;
	/**
	 * Aligns the header with the rows below it. Use the same value as their `Item`.
	 */
	inset?: ItemInset;
	/**
	 * Pins the header to the top of its scroll container.
	 */
	sticky?: boolean;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The label row of a group, such as Favorites, Recent or Moderators. It holds an `ItemGroupTitle` and optional trailing content.
 */
const ItemGroupHeader = ({ is: Tag = 'div', inset = 'none', sticky, className, ...props }: ItemGroupHeaderProps) => (
	<ItemGroupHeaderFrame
		{...(props as GetProps<typeof ItemGroupHeaderFrame>)}
		render={toRender(Tag)}
		sticky={!!sticky}
		className={cx(
			cxx('rcx-item-group-header')({
				[`inset-${inset}`]: inset !== 'none',
				sticky: !!sticky,
			}),
			className,
		)}
	/>
);

export default withFuselageProvider(ItemGroupHeader);
