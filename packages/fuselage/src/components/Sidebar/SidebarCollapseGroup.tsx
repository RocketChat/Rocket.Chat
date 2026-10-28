import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { ItemGroup } from '../Item';
import { SidebarGroupTitle } from './SidebarGroupTitle';
import { useCollapse } from './hooks/useCollapse';
import { boxFull } from './sidebarStyles';

const SidebarCollapseGroupFrame = styled(View, {
	...boxFull,
	flexWrap: 'nowrap',
});

type SidebarCollapseGroupProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		expanded?: boolean;
		defaultExpanded?: boolean;
		tabIndex?: number;
		title: string;
		empty?: boolean;
		badge?: ReactNode;
		menu?: ReactNode;
	};

function SidebarCollapseGroupBase({
	ref,
	expanded: propExpanded,
	defaultExpanded,
	tabIndex,
	children,
	badge,
	menu,
	title,
	empty,
	role = 'group',
	className,
	...props
}: SidebarCollapseGroupProps) {
	const { barProps, expanded, panelExpanded, panelId, titleId } = useCollapse({
		expanded: propExpanded,
		defaultExpanded,
		tabIndex,
	});

	const labelledBy = props['aria-label'] ? undefined : titleId;

	return (
		<SidebarCollapseGroupFrame
			className={cx('rcx-sidebar-collapse-group', className)}
			role={role as GetProps<typeof SidebarCollapseGroupFrame>['role']}
			aria-labelledby={labelledBy}
			{...(props as GetProps<typeof SidebarCollapseGroupFrame>)}
		>
			<SidebarGroupTitle
				expanded={expanded}
				empty={empty}
				title={title}
				titleId={titleId}
				badge={badge}
				menu={menu}
				barProps={barProps}
				role='button'
			/>
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
		</SidebarCollapseGroupFrame>
	);
}

export const SidebarCollapseGroup = withFuselageProvider(SidebarCollapseGroupBase);
