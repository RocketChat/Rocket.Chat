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
	// eslint-disable-next-line @typescript-eslint/naming-convention
	badge: Badge,
}: SidebarNavigationItemProps) => {
	const path = pathSection;
	const isActive = !!path && currentPath?.includes(path);

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarGenericItem active={isActive} href={path} externalUrl={externalUrl} aria-current={isActive ? 'page' : undefined}>
			{icon && <Icon name={icon} size='x20' marginInline={4} />}
			<Box
				fontScale='p2'
				marginInline={4}
				flexGrow={1}
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				columnGap={4}
				minWidth={0}
				width='100%'
			>
				<Box is='span' withTruncatedText>
					{label}
				</Box>
				{tag && <Tag flexShrink={0}>{tag}</Tag>}
			</Box>
			{Badge ? <Badge /> : null}
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
