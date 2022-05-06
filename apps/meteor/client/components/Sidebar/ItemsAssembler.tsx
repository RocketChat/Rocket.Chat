import React, { memo, FC } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import SidebarNavigationItem from './SidebarNavigationItem';

type ItemsAssemblerProps = {
	items: [];
	currentPath: string;
};

const ItemsAssembler: FC<ItemsAssemblerProps> = ({ items, currentPath }) => {
	const t = useTranslation();
	return (
		<>
			{items.map(({ href, pathSection, i18nLabel, name, icon, permissionGranted, pathGroup, tag }) => (
				<SidebarNavigationItem
					permissionGranted={permissionGranted}
					pathGroup={pathGroup}
					pathSection={href || pathSection}
					icon={icon}
					label={t(i18nLabel || name)}
					key={i18nLabel || name}
					currentPath={currentPath}
					tag={t(tag)}
				/>
			))}
			;
		</>
	);
};

export default memo(ItemsAssembler);
