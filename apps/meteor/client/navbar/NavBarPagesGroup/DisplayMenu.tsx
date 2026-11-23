import { Box, Menu, MenuItem, MenuSection, MenuSubmenuTrigger } from '@rocket.chat/fuselage';
import type { MenuProps } from '@rocket.chat/fuselage';
import { GenericMenuItem, useHandleMenuAction, useIsEnterprise } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ElementType } from 'react';
import { useTranslation } from 'react-i18next';

import { useSortMenu } from './hooks/useSortMenu';
import { useAllRoomsItems } from '../../sidebar/categories/hooks/useAllRoomsItems';

type DisplayMenuProps = {
	/** The component rendering the trigger, an icon button. */
	is?: ElementType;
	placement?: MenuProps<object>['placement'];
	className?: string;
};

const renderItem = (item: GenericMenuItemProps) => (
	<MenuItem key={item.id} textValue={item.textValue ?? (typeof item.content === 'string' ? item.content : undefined)}>
		<GenericMenuItem {...item} />
	</MenuItem>
);

/**
 * The sidebar's Display menu: view mode, sort and grouping, and on a licensed workspace an "All rooms" submenu
 * that sets the activity filter and the unread toggles of every group at once (`useAllRoomsItems`).
 */
const DisplayMenu = ({ is, placement, className }: DisplayMenuProps) => {
	const { t } = useTranslation();
	const sections = useSortMenu();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const allRooms = useAllRoomsItems();

	const allRoomsItems = isEnterprise ? [...allRooms.filterItems, ...allRooms.unreadItems] : [];
	const allItems = [...sections.flatMap(({ items }) => items), ...allRoomsItems];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);
	const handleAction = useHandleMenuAction(allItems);

	// An item without an icon keeps the column, so the labels line up with the ones that have one.
	const hasIcon = allItems.some(({ icon }) => icon);
	const withGap = (item: GenericMenuItemProps) => (hasIcon ? { ...item, gap: item.gap ?? (!item.icon && !item.status) } : item);

	return (
		<Menu
			icon='sort'
			title={t('Display')}
			is={is}
			placement={placement}
			className={className}
			selectionMode='multiple'
			{...(disabledKeys.length ? { disabledKeys } : {})}
			onAction={handleAction}
		>
			{[
				...sections.map(({ title, items }) => (
					<MenuSection key={title} title={title} items={items.map(withGap)}>
						{renderItem}
					</MenuSection>
				)),
				...(isEnterprise
					? [
							<MenuSection key='all-rooms' aria-label={t('All_rooms')}>
								<MenuSubmenuTrigger
									key='all-rooms'
									textValue={t('All_rooms')}
									selectionMode='multiple'
									selectedKeys={allRooms.selectedKeys}
									disabledKeys={allRooms.disabledKeys}
								>
									<MenuItem>
										<GenericMenuItem
											id='all-rooms'
											icon='customize'
											content={
												<Box>
													<Box>{t('All_rooms')}</Box>
													{allRooms.mixed && (
														<Box fontScale='c1' color='hint'>
															{t('Set_per_group')}
														</Box>
													)}
												</Box>
											}
										/>
									</MenuItem>
									<MenuSection title={t('Filter')} items={allRooms.filterItems}>
										{renderItem}
									</MenuSection>
									<MenuSection title={t('Unreads')} items={allRooms.unreadItems}>
										{renderItem}
									</MenuSection>
								</MenuSubmenuTrigger>
							</MenuSection>,
						]
					: []),
			]}
		</Menu>
	);
};

export default DisplayMenu;
