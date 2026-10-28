import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { memo } from 'react';

import SidebarGenericItem from './SidebarGenericItem';

export type SidebarNavigationItemProps = {
	permissionGranted?: (() => boolean) | boolean;
	pathSection: string;
	icon?: IconName;
	label?: string;
	tag?: string;
	currentPath?: string;
	externalUrl?: boolean;
	badge?: () => ReactNode;
};

const SidebarNavigationItem = ({
	permissionGranted,
	pathSection,
	icon,
	label,
	currentPath,
	tag,
	externalUrl,
	badge: Badge,
}: SidebarNavigationItemProps) => {
	const path = pathSection;
	const isActive = !!path && currentPath?.includes(path);

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarGenericItem active={isActive} href={path} externalUrl={externalUrl} aria-current={isActive ? 'page' : undefined}>
			<Box display='flex' alignItems='center' gap={8} marginInline={4} flexGrow={1} minWidth={0}>
				{icon && <Icon name={icon} size='x20' />}
				<Box
					fontScale='p2'
					flexGrow={1}
					display='flex'
					alignItems='center'
					justifyContent='space-between'
					columnGap={4}
					minWidth={0}
					width='100%'
				>
					<Box is='span' withTruncatedText flexGrow={1} flexBasis='0%'>
						{label}
					</Box>
					{tag && <Tag>{tag}</Tag>}
				</Box>
			</Box>
			{Badge ? <Badge /> : null}
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
