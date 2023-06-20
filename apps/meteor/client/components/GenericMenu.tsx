import type { MenuItemIcon } from '@rocket.chat/fuselage';
import { MenuItem, MenuSection, MenuV2 } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

import { useHandleMenuAction } from '../hooks/useHandleMenuAction';
import type { GenericMenuItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';

export type GenericMenuProps = {
	sections: {
		title: string;
		items: GenericMenuItemProps[];
		permission: boolean | '' | 0 | null | undefined;
	}[];
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	title: string;
};

const GenericMenuContent = ({ sections, title, icon = 'menu' }: GenericMenuProps) => {
	const t = useTranslation();

	const items = sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]);

	const handleAction = useHandleMenuAction(items);
	return (
		<MenuV2 icon={icon} title={t.has(title) ? t(title) : title} onAction={handleAction}>
			{sections.map(({ title, items }, key) => (
				<MenuSection title={t.has(title) ? t(title) : title} items={items} key={`${title}-${key}`}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>
			))}
		</MenuV2>
	);
};

export default GenericMenuContent;
