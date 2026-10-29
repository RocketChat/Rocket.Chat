import type { AriaAttributes, HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { Chevron } from '../Chevron';
import { ItemGroupHeader, ItemGroupTitle } from '../Item';

export type SidebarGroupTitleProps = {
	expanded?: boolean;
	empty?: boolean;
	title?: string;
	titleId?: string;
	badge?: ReactNode;
	/** Controls shown right after the title, outside the button that toggles the group. */
	actions?: ReactNode;
	menu?: ReactNode;
	barProps?: AriaAttributes;
} & HTMLAttributes<HTMLDivElement>;

// The actions sit outside the toggle, so activating one neither collapses nor expands the group; every other key
// still bubbles, so the list keeps its shortcuts.
const stopPropagation = (event: MouseEvent) => event.stopPropagation();
const stopActivationKeys = (event: KeyboardEvent) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.stopPropagation();
	}
};

/**
 * The header of a sidebar group. It renders an `ItemGroupHeader`, so its menu reveals on hover like a row's.
 */
export const SidebarGroupTitle = ({
	title,
	titleId,
	badge,
	actions,
	menu,
	barProps,
	expanded,
	empty,
	role,
	className,
	...props
}: SidebarGroupTitleProps) => {
	const titleRef = useRef<HTMLElement>(null);
	const actionsRef = useRef<HTMLDivElement>(null);
	const focusInActions = useRef(false);

	// An action may disappear while it has focus (a filter chip once nothing is left to hide, say). The browser
	// would drop focus to the document; the title takes it instead, so the keyboard stays on the group.
	useLayoutEffect(() => {
		if (focusInActions.current && !actionsRef.current?.contains(document.activeElement)) {
			focusInActions.current = false;
			titleRef.current?.focus();
		}
	});

	return (
		<ItemGroupHeader
			{...(props as Omit<HTMLAttributes<HTMLDivElement>, 'is'>)}
			inset='md'
			className={cx(
				'rcx-sidebar-collapse-group__bar',
				!expanded && empty && 'rcx-sidebar-collapse-group__bar--empty',
				!expanded && !!badge && 'rcx-sidebar-collapse-group__bar--unread',
				!!actions && 'rcx-sidebar-collapse-group__bar--with-actions',
				className,
			)}
		>
			<ItemGroupTitle role={role} {...barProps} ref={titleRef} className='rcx-sidebar-collapse-group__bar-button'>
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
			{actions && (
				// Only a container: it keeps the actions' activation from reaching the header and acts on nothing itself.
				<div
					ref={actionsRef}
					role='presentation'
					className='rcx-sidebar-collapse-group__actions'
					onClick={stopPropagation}
					onKeyDown={stopActivationKeys}
					onFocusCapture={() => {
						focusInActions.current = true;
					}}
					onBlurCapture={() => {
						focusInActions.current = false;
					}}
				>
					{actions}
				</div>
			)}
			{menu}
		</ItemGroupHeader>
	);
};
