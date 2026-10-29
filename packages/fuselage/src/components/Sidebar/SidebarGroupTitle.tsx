import type { AriaAttributes, HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Chevron } from '../Chevron';
import { ItemGroupHeader, ItemGroupTitle, type ItemGroupHeaderProps, type ItemGroupTitleProps } from '../Item';

export type SidebarGroupTitleProps = {
	expanded?: boolean;
	empty?: boolean;
	title?: string;
	titleId?: string;
	badge?: ReactNode;
	menu?: ReactNode;
	barProps?: Pick<
		ItemGroupTitleProps,
		'aria-controls' | 'aria-expanded' | 'aria-disabled' | 'aria-labelledby' | 'tabIndex' | 'onClick' | 'onKeyDown'
	>;
	role?: ItemGroupTitleProps['role'];
} & Omit<ItemGroupHeaderProps, 'is' | 'inset' | 'title' | 'role'>;

/**
 * The header of a sidebar group. It renders an `ItemGroupHeader`, so its menu reveals on hover like a row's.
 */
export const SidebarGroupTitle = ({
	title,
	titleId,
	badge,
	menu,
	barProps,
	expanded,
	empty,
	role,
	className,
	...props
}: SidebarGroupTitleProps) => (
	<ItemGroupHeader
		{...props}
		inset='md'
		className={cx(
			'rcx-sidebar-collapse-group__bar',
			!expanded && empty && 'rcx-sidebar-collapse-group__bar--empty',
			!expanded && !!badge && 'rcx-sidebar-collapse-group__bar--unread',
			className,
		)}
	>
		<ItemGroupTitle role={role} {...barProps} className='rcx-sidebar-collapse-group__bar-button'>
			<div className='rcx-sidebar-collapse-group__heading'>
				{title && (
					<h4 className='rcx-sidebar-collapse-group__title' id={titleId}>
						{title}
					</h4>
				)}
				{expanded !== undefined && <Chevron size='x20' right={!expanded} />}
			</div>
			{!expanded && badge && badge}
		</ItemGroupTitle>
		{menu}
	</ItemGroupHeader>
);
