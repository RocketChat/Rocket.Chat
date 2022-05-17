import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import Sidebar from './Sidebar';

const ItemsAssembler = ({ items, currentPath }) => {
	const t = useTranslation();
	return items.map(({ href, pathSection, i18nLabel, name, icon, permissionGranted, pathGroup, tag }) => (
		<Sidebar.NavigationItem
			permissionGranted={permissionGranted}
			pathGroup={pathGroup}
			pathSection={href || pathSection}
			icon={icon}
			label={t(i18nLabel || name)}
			key={i18nLabel || name}
			currentPath={currentPath}
			tag={t(tag)}
		/>
	));
};

export default memo(ItemsAssembler);
