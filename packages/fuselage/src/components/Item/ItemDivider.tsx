import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import type { ItemInset } from './types';
import { cx, cxx } from '../../helpers/composeClassNames';

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
	<Tag
		{...props}
		className={cx(
			cxx('rcx-item-divider')({
				[`inset-${inset}`]: inset !== 'none',
			}),
			className,
		)}
	/>
);

export default ItemDivider;
