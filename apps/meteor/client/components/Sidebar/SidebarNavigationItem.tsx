import { Box, Icon, IconProps, Tag } from '@rocket.chat/fuselage';
import { useRoutePath } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo, FC } from 'react';

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

	if (permissionGranted === false || (typeof permissionGranted === 'function' && !permissionGranted())) {
		return null;
	}
	return (
		<SidebarGenericItem active={isActive} href={path} key={path}>
			{icon && <Icon name={icon} size='x20' mi='x4' />}
			<Box withTruncatedText fontScale='p2' mi='x4' color='info'>
				{label} {tag && <Tag style={{ display: 'inline', backgroundColor: '#000', color: '#FFF', marginLeft: 4 }}>{tag}</Tag>}
			</Box>
		</SidebarGenericItem>
	);
};

export default memo(SidebarNavigationItem);
