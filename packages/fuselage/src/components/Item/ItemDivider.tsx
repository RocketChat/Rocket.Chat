import { styled, View } from '@tamagui/web';
import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import { itemColorStrokeDivider } from './itemStyles';
import type { ItemInset } from './types';
import { cx, cxx } from '../../helpers/composeClassNames';
import { borderWidth, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const insetMargin = { marginInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))` };

// The line takes its color from here, so a consumer's `border-color` on the divider still reaches it
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
	borderColor: itemColorStrokeDivider,

	variants: {
		inset: {
			none: {},
			sm: insetMargin,
			md: insetMargin,
			lg: insetMargin,
		},
	} as const,
});

const ItemDividerLine = styled(View, {
	render: 'span',
	display: 'block',
	borderTopWidth: borderWidth('default'),
	borderTopStyle: 'solid',
	borderTopColor: 'inherit',
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
const ItemDivider = ({ is: Tag = 'div', inset = 'none', className, children, ...props }: ItemDividerProps) => (
	<ItemDividerFrame
		render={<Tag {...props} />}
		inset={inset}
		className={cx(
			cxx('rcx-item-divider')({
				[`inset-${inset}`]: inset !== 'none',
			}),
			className,
		)}
	>
		<ItemDividerLine aria-hidden className='rcx-item-divider__line' />
		{children}
	</ItemDividerFrame>
);

export default withFuselageProvider(ItemDivider);
