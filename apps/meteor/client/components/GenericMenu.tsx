import type { MenuItemIcon } from '@rocket.chat/fuselage';
import { MenuItem, MenuSection, MenuV2 } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, Key } from 'react';
import React from 'react';

import type { GenericMenuItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';

export type GenericMenuProps = {
	sections: {
		title?: string;
		items: GenericMenuItemProps[];
		permission?: boolean | '' | 0 | null | undefined;
	}[];
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	title: string;
	onAction?: (key: Key) => void;
};

const GenericMenu = ({ sections, title, icon = 'menu', ...props }: GenericMenuProps & Omit<ComponentProps<typeof MenuV2>, 'children'>) => {
	const t = useTranslation();

	return (
		<MenuV2 icon={icon} title={t.has(title) ? t(title) : title} {...props}>
			{sections.map(({ title, items }, key) => (
				<MenuSection title={title && (t.has(title) ? t(title) : title)} items={items} key={`${title}-${key}`}>
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

export default GenericMenu;
