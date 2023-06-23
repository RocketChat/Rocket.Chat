import type { Icon } from '@rocket.chat/fuselage';
import { MenuItem, MenuSection, MenuV2 } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

import type { GenericMenuItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';

type GenericMenuCommonProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	title: string;
};
type GenericMenuConditionalProps =
	| {
			sections?: {
				title?: string;
				items: GenericMenuItemProps[];
				permission?: boolean | '' | 0 | null | undefined;
			}[];
			items?: never;
	  }
	| {
			items?: GenericMenuItemProps[];
			sections?: never;
	  };

type GenericMenuProps = GenericMenuCommonProps & GenericMenuConditionalProps & Omit<ComponentProps<typeof MenuV2>, 'children'>;

const GenericMenu = ({ title, icon = 'menu', ...props }: GenericMenuProps) => {
	const t = useTranslation();

	const sections = 'sections' in props && props.sections;
	const items = 'items' in props && props.items;

	return (
		<>
			{sections && (
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
			)}
			{items && (
				<MenuV2 icon={icon} title={t.has(title) ? t(title) : title} {...props}>
					{items.map((item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					))}
				</MenuV2>
			)}
		</>
	);
};

export default GenericMenu;
