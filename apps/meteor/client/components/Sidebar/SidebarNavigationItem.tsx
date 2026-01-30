import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactElement } from 'react';
import { memo } from 'react';

import SidebarGenericItem from './SidebarGenericItem';

type SidebarNavigationItemProps = {
	permissionGranted?: (() => boolean) | boolean;
	pathSection: string;
	icon?: IconName;
	label?: string;
	tag?: string;
	currentPath?: string;
	externalUrl?: boolean;
	badge?: () => ReactElement;
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
	const isActive = !!path && currentPath?.includes(path as string);

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarGenericItem active={isActive} href={path} externalUrl={externalUrl}>
			{icon && <Icon name={icon} size='x20' mi={4} />}
			<Box
				withTruncatedText
				fontScale='p2'
				mi={4}
				flexGrow={1}
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				width='100%'
			>
				{label} {tag && <Tag>{tag}</Tag>}
			</Box>
			{Badge ? <Badge /> : null}
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
