import type { AllHTMLAttributes, ElementType, MouseEvent, RefAttributes } from 'react';

import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemActionsProps = {
	is?: ElementType;
	/**
	 * `hover` hides the actions until the row is hovered, holds focus or has an expanded menu.
	 * They stay in the tab order, and touch screens always show them.
	 */
	reveal?: 'always' | 'hover';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'> &
	RefAttributes<HTMLElement>;

/**
 * The trailing buttons, icon buttons or menu trigger of an `Item` or `ItemGroupHeader`.
 * Placed as a direct child it spans every row; placed inside an `ItemRow` it only takes space from that row.
 * Clicks inside it never reach the row, so an action never also opens the row's `ItemLink` or runs its `onClick`.
 */
const ItemActions = ({ is: Tag = 'div', reveal = 'always', className, onClick, children, ...props }: ItemActionsProps) => (
	<Tag
		{...props}
		className={cx(cxx('rcx-item__actions')({ 'reveal-hover': reveal === 'hover' }), className)}
		onClick={(event: MouseEvent<HTMLElement>) => {
			event.stopPropagation();
			onClick?.(event);
		}}
	>
		{reveal === 'hover' ? <div className='rcx-item__actions-inner'>{children}</div> : children}
	</Tag>
);

export default ItemActions;
