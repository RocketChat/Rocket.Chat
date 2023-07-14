import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import type { IconProps } from '@rocket.chat/fuselage';
import type { FC, ReactElement } from 'react';
import React, { memo } from 'react';

import SidebarGenericItem from './SidebarGenericItem';

type SidebarNavigationItemProps = {
	permissionGranted?: (() => boolean) | boolean;
	pathSection: string;
	icon?: IconProps['name'];
	label?: string;
	tag?: string;
	currentPath?: string;
	externalUrl?: boolean;
	badge?: () => ReactElement;
};

const SidebarNavigationItem: FC<SidebarNavigationItemProps> = ({
	permissionGranted,
	pathSection,
	icon,
	label,
	currentPath,
	tag,
	externalUrl,
	// eslint-disable-next-line @typescript-eslint/naming-convention
	badge: Badge,
}) => {
	const path = pathSection;
	const isActive = !!path && currentPath?.includes(path as string);

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarGenericItem active={isActive} href={path} externalUrl={externalUrl}>
			{icon && <Icon name={icon} size='x20' mi='x4' />}
			<Box
				withTruncatedText
				fontScale='p2'
				mi='x4'
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
