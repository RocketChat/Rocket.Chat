import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';
import { Children } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroup } from '../Item';
import { SidebarGroupTitle } from './SidebarGroupTitle';
import { useCollapse } from './hooks/useCollapse';

type SidebarCollapseGroupProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		expanded?: boolean;
		defaultExpanded?: boolean;
		tabIndex?: number;
		title: string;
		empty?: boolean;
		badge?: ReactNode;
		menu?: ReactNode;
		actions?: ReactNode;
	};

export function SidebarCollapseGroup({
	ref,
	expanded: propExpanded,
	defaultExpanded,
	tabIndex,
	children,
	badge,
	menu,
	actions: _actions,
	title,
	empty,
	role = 'group',
	...props
}: SidebarCollapseGroupProps) {
	const { barProps, expanded, panelExpanded, panelId, titleId } = useCollapse({
		expanded: propExpanded,
		defaultExpanded,
		tabIndex,
	});

	const labelledBy = props['aria-label'] ? undefined : titleId;

	// A header whose rows live elsewhere, as in a virtualized list, has no panel to control
	const hasPanel = Children.toArray(children).length > 0;
	const titleBarProps = hasPanel ? barProps : { ...barProps, 'aria-controls': undefined };

	return (
		<div className='rcx-box rcx-box--full rcx-sidebar-collapse-group' role={role} aria-labelledby={labelledBy} {...props}>
			<SidebarGroupTitle
				expanded={expanded}
				empty={empty}
				title={title}
				titleId={titleId}
				badge={badge}
				menu={menu}
				barProps={titleBarProps}
				role='button'
			/>
			{hasPanel && (
				<ItemGroup
					role='list'
					aria-labelledby={titleId}
					ref={ref}
					className={cx(
						'rcx-sidebar-collapse-group__panel rcx-box--animated',
						panelExpanded && 'rcx-sidebar-collapse-group__panel--expanded',
					)}
					id={panelId}
				>
					{children}
				</ItemGroup>
			)}
		</div>
	);
}
