import { useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React, { memo } from 'react';

import type { SidebarItem } from '../../lib/createSidebarItems';
import SidebarNavigationItem from './SidebarNavigationItem';

type SidebarItemsAssemblerProps = {
	items: SidebarItem[];
	currentPath?: string;
};

const SidebarItemsAssembler: FC<SidebarItemsAssemblerProps> = ({ items, currentPath }) => {
	const t = useTranslation();
	return (
		<>
			{items.map(({ href, pathSection, i18nLabel, name, icon, permissionGranted, pathGroup, tag }) => (
				<SidebarNavigationItem
					permissionGranted={permissionGranted}
					pathGroup={pathGroup || ''}
					pathSection={href || pathSection || ''}
					icon={icon}
					label={t((i18nLabel || name) as Parameters<typeof t>[0])}
					key={i18nLabel || name}
					currentPath={currentPath}
					tag={t.has(tag as Parameters<typeof t>[0]) ? t(tag as Parameters<typeof t>[0]) : undefined}
				/>
			))}
		</>
	);
};

export default memo(SidebarItemsAssembler);
