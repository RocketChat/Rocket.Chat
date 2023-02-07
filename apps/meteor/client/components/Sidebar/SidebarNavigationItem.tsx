import type { IconProps } from '@rocket.chat/fuselage';
import { Badge, Skeleton, Box, Icon, Tag } from '@rocket.chat/fuselage';
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
	externalUrl?: boolean;
};

const SidebarNavigationItem: FC<SidebarNavigationItemProps> = ({
	permissionGranted,
	pathGroup,
	pathSection,
	icon,
	label,
	currentPath,
	tag,
	externalUrl,
}) => {
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(pathSection, params);
	const isActive = !!path && currentPath?.includes(path as string);

	const { data: appRequestStats, isLoading, isError } = useAppRequestStats();

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}

	const handleAppsRequestBadge = () => {
		if (currentPath?.includes('marketplace') && label === 'Requested') {
			if (isLoading) return <Skeleton variant='rect' height='x16' width='x16' />;

			if (isError || !appRequestStats.data.totalUnseen) return null;

			return (
				<Box>
					<Badge variant='primary'>{appRequestStats?.data.totalUnseen}</Badge>
				</Box>
			);
		}
	};

	return (
		<SidebarGenericItem active={isActive} href={path} externalUrl={externalUrl}>
			{icon && <Icon name={icon} size='x20' mi='x4' />}
			<Box withTruncatedText fontScale='p2' mi='x4' display='flex' alignItems='center' justifyContent='space-between' width='100%'>
				{label} {tag && <Tag>{tag}</Tag>}
				{handleAppsRequestBadge()}
			</Box>
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
