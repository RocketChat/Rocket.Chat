import type { RoomType } from '@rocket.chat/core-typings';
import { Menu, MenuItem, MenuItemContent, MenuItemIcon, MenuItemInput, MenuSection, MenuSubmenuTrigger } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenuItem } from '@rocket.chat/ui-client';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomMenuActions } from '../hooks/useRoomMenuActions';
import { useRoomCategoryItems } from './categories/useRoomCategoryItems';

export type RoomMenuProps = {
	rid: string;
	unread?: boolean;
	threadUnread?: boolean;
	alert?: boolean;
	roomOpen?: boolean;
	type: RoomType;
	cl?: boolean;
	name?: string;
	hideDefaultOptions: boolean;
};

const makeHandleAction = (items: GenericMenuItemProps[]) => (id: string | number) => {
	const item = items.find((item) => item.id === String(id) && !!item.onClick);
	item?.onClick?.();
};

const renderSectionItem = (item: GenericMenuItemProps) => (
	<MenuItem
		key={item.id}
		aria-label={typeof item.content === 'string' ? item.content : item.id}
		textValue={typeof item.content === 'string' ? item.content : item.id}
	>
		<GenericMenuItem {...item} />
	</MenuItem>
);

const renderSubmenuItem = (item: GenericMenuItemProps) => (
	<MenuItem
		key={item.id}
		aria-label={typeof item.content === 'string' ? item.content : item.id}
		textValue={typeof item.content === 'string' ? item.content : item.id}
	>
		{item.icon && <MenuItemIcon name={item.icon} color={item.iconColor} />}
		{item.content && <MenuItemContent>{item.content}</MenuItemContent>}
		{item.addon && <MenuItemInput>{item.addon}</MenuItemInput>}
	</MenuItem>
);

const RoomMenu = ({ rid, unread, threadUnread, alert, roomOpen, type, cl, name = '', hideDefaultOptions = false }: RoomMenuProps) => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid);
	const buildCategoryItems = useRoomCategoryItems();

	const isUnread = alert || unread || threadUnread;
	const allSections = useRoomMenuActions({ rid, type, name, isUnread, cl, roomOpen, hideDefaultOptions });

	if (!hideDefaultOptions && type !== 'l') {
		const isFavorite = Boolean(subscription?.f);
		const { moveToItems, removeItem } = buildCategoryItems({ rid, name, isFavorite });

		// Strip toggleFavorite — the submenu's "Favorites" target replaces it.
		const actionSections = allSections
			.map((section) => ({ ...section, items: section.items.filter((item) => item.id !== 'toggleFavorite') }))
			.filter((section) => section.items.length > 0);

		// Separate "New category" from the regular category targets so it always goes last in the submenu.
		const categoryTargets = moveToItems.filter((item) => item.id !== 'newCategory');
		const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');

		const allItems = [...actionSections.flatMap((s) => s.items), ...moveToItems, ...(removeItem ? [removeItem] : [])];
		const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
		const handleAction = makeHandleAction(allItems);

		const submenuActionsItems = [...(newCategoryItem ? [newCategoryItem] : []), ...(removeItem ? [removeItem] : [])];

		return (
			<Menu detached title={t('Options')} mini icon='kebab' aria-keyshortcuts='alt' onAction={handleAction} disabledKeys={disabledKeys}>
				{[
					...actionSections.map(({ title, items }, index) => (
						<MenuSection key={title || String(index)} aria-label={title || t('Options')} title={title || undefined} items={items}>
							{renderSectionItem}
						</MenuSection>
					)),
					<MenuSection key='category' title={t('Category')}>
						<MenuSubmenuTrigger key='moveTo' textValue={t('Move_to')}>
							<MenuItem aria-label={t('Move_to')}>
								<MenuItemIcon name='folder' />
								<MenuItemContent>{t('Move_to')}</MenuItemContent>
							</MenuItem>
							<MenuSection items={categoryTargets}>{renderSubmenuItem}</MenuSection>
							{submenuActionsItems.length > 0 && <MenuSection items={submenuActionsItems}>{renderSubmenuItem}</MenuSection>}
						</MenuSubmenuTrigger>
					</MenuSection>,
				]}
			</Menu>
		);
	}

	// Livechat rooms or hideDefaultOptions — simple flat menu, no category submenu.
	const allItems = allSections.flatMap((s) => s.items);
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = makeHandleAction(allItems);

	return (
		<Menu detached title={t('Options')} mini icon='kebab' aria-keyshortcuts='alt' onAction={handleAction} disabledKeys={disabledKeys}>
			{allSections.map(({ title, items }, index) => (
				<MenuSection key={title || String(index)} aria-label={title || t('Options')} title={title || undefined} items={items}>
					{renderSectionItem}
				</MenuSection>
			))}
		</Menu>
	);
};

export default memo(RoomMenu);
