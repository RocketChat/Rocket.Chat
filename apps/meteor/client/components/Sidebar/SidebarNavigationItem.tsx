import type { IconProps } from '@rocket.chat/fuselage';
import { Badge, Box, Icon, Tag } from '@rocket.chat/fuselage';
import { useRoutePath } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo, useMemo } from 'react';

import { useAppRequestStats } from '../../views/marketplace/hooks/useAppRequestStats';
import SidebarGenericItem from './SidebarGenericItem';

type SidebarNavigationItemProps = {
	permissionGranted?: (() => boolean) | boolean;
	pathGroup: string;
	pathSection: string;
	icon?: IconProps['name'];
	label?: string;
	tag?: string;
	currentPath?: string;
};

const SidebarNavigationItem: FC<SidebarNavigationItemProps> = ({
	permissionGranted,
	pathGroup,
	pathSection,
	icon,
	label,
	currentPath,
	tag,
}) => {
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(pathSection, params);
	const isActive = currentPath?.includes(path as string);

	const appRequestStats = useAppRequestStats();

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	return (
		<SidebarGenericItem active={isActive} href={path} key={path}>
			{icon && <Icon name={icon} size='x20' mi='x4' />}
			<Box withTruncatedText fontScale='p2' mi='x4' display='flex' alignItems='center' justifyContent='space-between' width='100%'>
				{label} {tag && <Tag>{tag}</Tag>}
				{currentPath?.includes('marketplace') && label === 'Requested' && Boolean(appRequestStats.data?.data.totalUnseen) && (
					<Box>
						<Badge variant='primary'>{appRequestStats.data?.data.totalUnseen}</Badge>
					</Box>
				)}
			</Box>
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
