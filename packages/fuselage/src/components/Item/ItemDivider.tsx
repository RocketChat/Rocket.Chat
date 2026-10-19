import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { toRender } from './itemStyles';
import type { ItemInset } from './types';
import { cx, cxx } from '../../helpers/composeClassNames';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const insetMargin = { marginInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))` };

// The line itself is a `::before` and the inset widths are custom properties, so both stay in SCSS.
const ItemDividerFrame = styled(View, {
	display: 'block',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: 0,
	paddingBlock: spacing('x4'),
	paddingInline: 0,
	listStyle: 'none',
	borderWidth: 0,

	variants: {
		inset: {
			none: {},
			sm: insetMargin,
			md: insetMargin,
			lg: insetMargin,
		},
	} as const,
});

export type ItemDividerProps = {
	/**
	 * The element to render. Inside an `ItemGroup` rendered as `ul`, pass `li` with `aria-hidden`.
	 * Add `role='separator'` where the divider should be announced, as between menu sections.
	 */
	is?: ElementType;
	/**
	 * Aligns the line with the content of the rows. Without it, the line spans the full width.
	 */
	inset?: ItemInset;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The divider between groups, menu sections, or a header and its rows.
 */
const ItemDivider = ({ is: Tag = 'div', inset = 'none', className, ...props }: ItemDividerProps) => (
	<ItemDividerFrame
		{...(props as GetProps<typeof ItemDividerFrame>)}
		render={toRender(Tag)}
		inset={inset}
		className={cx(
			cxx('rcx-item-divider')({
				[`inset-${inset}`]: inset !== 'none',
			}),
			className,
		)}
	/>
);

export default withFuselageProvider(ItemDivider);
