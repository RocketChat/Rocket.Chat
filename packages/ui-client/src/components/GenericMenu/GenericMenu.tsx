import { IconButton, MenuItem, MenuSection, MenuSubmenuTrigger, Menu } from '@rocket.chat/fuselage';
import { cloneElement, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { GenericMenuItemProps } from './GenericMenuItem';
import GenericMenuItem from './GenericMenuItem';
import { useHandleMenuAction } from './hooks/useHandleMenuAction';

type GenericMenuCommonProps = {
	title: string;
	icon?: ComponentProps<typeof IconButton>['icon'];
	disabled?: boolean;
	callbackAction?: () => void;
	isOpen?: boolean;
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

export type GenericMenuProps = GenericMenuCommonProps & GenericMenuConditionalProps & Omit<ComponentProps<typeof Menu>, 'children'>;

const renderItem = (item: GenericMenuItemProps) =>
	item.submenu ? (
		<MenuSubmenuTrigger key={item.id} textValue={item.textValue ?? (typeof item.content === 'string' ? item.content : item.id)}>
			<MenuItem key={item.id}>
				<GenericMenuItem {...item} />
			</MenuItem>
			<MenuSection items={item.submenu}>
				{(subitem) => (
					<MenuItem key={subitem.id} {...(subitem.textValue && { textValue: subitem.textValue })}>
						<GenericMenuItem {...subitem} />
					</MenuItem>
				)}
			</MenuSection>
		</MenuSubmenuTrigger>
	) : (
		<MenuItem key={item.id} {...(item.textValue && { textValue: item.textValue })}>
			<GenericMenuItem {...item} />
		</MenuItem>
	);

const GenericMenu = ({ title, icon = 'menu', disabled, onAction, callbackAction, button, className, ...props }: GenericMenuProps) => {
	const { t, i18n } = useTranslation();

	const sections = 'sections' in props && props.sections;
	const items = 'items' in props && props.items;

	const topLevelItems = sections ? sections.flatMap(({ items }) => items) : items || [];
	// Submenu items act through the same handler as the top-level ones.
	const itemsList = topLevelItems.flatMap((item) => [item, ...(item.submenu ?? [])]);

	const disabledKeys = itemsList.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(itemsList || [], callbackAction);

	const hasIcon = topLevelItems.some(({ icon }) => icon);
	const handleItems = (items: GenericMenuItemProps[]) =>
		hasIcon ? items.map((item) => ({ ...item, gap: item.gap ?? (!item.icon && !item.status) })) : items;

	const isMenuEmpty = !(sections && sections.length > 0) && !(items && items.length > 0);

	if (isMenuEmpty || disabled) {
		if (button) {
			// FIXME: deprecate prop `button` as there's no way to ensure it is actually a button
			// (e.g cloneElement could be passing props to a fragment)
			return cloneElement(button, { small: true, icon, disabled, title, className } as any);
		}

		return <IconButton small icon={icon} className={className} title={title} disabled />;
	}

	return (
		<>
			{sections && (
				<Menu
					icon={icon}
					title={i18n.exists(title) ? t(title) : title}
					onAction={onAction || handleAction}
					className={className}
					button={button}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{sections.map(({ title, items }, key) => (
						<MenuSection
							title={typeof title === 'string' && i18n.exists(title) ? t(title) : title}
							items={handleItems(items)}
							key={`${title}-${key}`}
						>
							{renderItem}
						</MenuSection>
					))}
				</Menu>
			)}
			{items && (
				<Menu
					icon={icon}
					title={i18n.exists(title) ? t(title) : title}
					onAction={onAction || handleAction}
					className={className}
					button={button}
					{...(disabledKeys && { disabledKeys })}
					{...props}
				>
					{handleItems(items).map(renderItem)}
				</Menu>
			)}
		</>
	);
};

export default GenericMenu;
