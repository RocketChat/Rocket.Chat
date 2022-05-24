import { IconProps } from '@rocket.chat/fuselage';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, FC } from 'react';

import SidebarNavigationItem from './SidebarNavigationItem';

type Item = {
	name: string;
	pathSection: string;
	pathGroup?: string;
	href?: string;
	i18nLabel?: any;
	icon?: IconProps['name'];
	permissionGranted?: () => boolean;
	tag?: TranslationKey;
};

type ItemsAssemblerProps = {
	items: Item[];
	currentPath?: string;
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
					tag={tag && t(tag)}
				/>
			))}
			;
		</>
	);
};

export default memo(ItemsAssembler);
