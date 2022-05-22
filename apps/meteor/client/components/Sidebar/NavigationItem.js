import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { useRoutePath } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import Sidebar from './Sidebar';

const NavigationItem = ({ permissionGranted, pathGroup, pathSection, icon, label, currentPath, tag }) => {
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(pathSection, params);
	const isActive = path === currentPath || false;
	if (permissionGranted && !permissionGranted()) {
		return null;
	}
	return (
		<Sidebar.GenericItem active={isActive} href={path} key={path}>
			{icon && <Icon name={icon} size='x20' mi='x4' />}
			<Box withTruncatedText fontScale='p2' mi='x4' color='info'>
				{label} {tag && <Tag style={{ display: 'inline', backgroundColor: '#000', color: '#FFF', marginLeft: 4 }}>{tag}</Tag>}
			</Box>
		</Sidebar.GenericItem>
	);
};

export default memo(NavigationItem);
