import type { AllHTMLAttributes, ElementType, RefAttributes } from 'react';

import type { ItemInset } from './types';
import { cx, cxx } from '../../helpers/composeClassNames';

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
const ItemGroupHeader = ({ is: Component = 'div', inset = 'none', sticky, className, ...props }: ItemGroupHeaderProps) => (
	<Component
		{...props}
		className={cx(
			cxx('rcx-item-group-header')({
				[`inset-${inset}`]: inset !== 'none',
				sticky: !!sticky,
			}),
			className,
		)}
	/>
);

export default ItemGroupHeader;
