import { IconButton, MenuItem, MenuSection, MenuV2 } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

import type { GenericMenuItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';
import { useHandleMenuAction } from './hooks/useHandleMenuAction';

type GenericMenuCommonProps = {
	icon?: ComponentProps<typeof IconButton>['icon'];
	title: string;
};
type GenericMenuConditionalProps =
	| {
			sections?: {
				title?: ReactNode;
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

const GenericMenu = ({ title, icon = 'menu', onAction, ...props }: GenericMenuProps) => {
	const t = useTranslation();

	const sections = 'sections' in props && props.sections;
	const items = 'items' in props && props.items;

	const itemsList = sections ? sections.reduce((acc, { items }) => [...acc, ...items], [] as GenericMenuItemProps[]) : items || [];

	const disabledKeys = itemsList.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(itemsList || []);

	const hasIcon = itemsList.some(({ icon }) => icon);
	const handleItems = (items: GenericMenuItemProps[]) =>
		hasIcon ? items.map((item) => ({ ...item, gap: !item.icon && !item.status })) : items;

	const isMenuEmpty = !(sections && sections.length > 0) && !(items && items.length > 0);

	if (isMenuEmpty) {
		return <IconButton icon={icon} disabled />;
	}

	return (
		<>
			{sections && (
				<MenuV2
					icon={icon}
					title={t.has(title) ? t(title) : title}
					onAction={onAction || handleAction}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{sections.map(({ title, items }, key) => (
						<MenuSection
							title={typeof title === 'string' && t.has(title) ? t(title) : title}
							items={handleItems(items)}
							key={`${title}-${key}`}
						>
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
				<MenuV2
					icon={icon}
					title={t.has(title) ? t(title) : title}
					onAction={onAction || handleAction}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{handleItems(items).map((item) => (
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
