import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Menu, MenuItem, MenuSection, MenuSubmenuTrigger, ToggleSwitch } from '@rocket.chat/fuselage';
import { useStableCallback, useToggle } from '@rocket.chat/fuselage-hooks';
import { GenericMenuItem, useHandleMenuAction } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { isActivityFilterable } from './hooks/useActivityFilter';
import {
	ACTIVITY_FILTER_HIDES_UNREADS_ITEM_ID,
	getActivityFilterItemId,
	useActivityFilterHidesUnreadsItem,
	useActivityFilterItems,
} from './hooks/useActivityFilterItems';
import { useArchiveRoomsItems } from './hooks/useArchiveRoomsItems';
import { useCategoryModals } from './hooks/useCategoryModals';
import { useMoveRoomCategory } from './hooks/useMoveRoomCategory';
import { useToggleUnreads } from './hooks/useToggleUnreads';
import { useCreateNewItems } from '../../navbar/NavBarPagesGroup/hooks/useCreateNewItems';

type CategoryMenuProps = {
	category?: ISidebarCategory;
	groupKey: string;
	/** The group as its header names it. */
	groupTitle: string;
	/** Every room of the group, the ones the collapse or the filter leaves out included. */
	rooms: SubscriptionWithRoom[];
	showUnreads: boolean;
	keepUnreadsOnTop: boolean;
	activityFilterHours?: number;
	activityFilterHidesUnreads?: boolean;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	/** The user chose a window from the Filter submenu; `undefined` means "All". */
	onActivityFilterChange?: (activityFilterHours: number | undefined) => void;
};

const CategoryMenu = ({
	category,
	groupKey,
	groupTitle,
	rooms,
	showUnreads,
	keepUnreadsOnTop,
	activityFilterHours,
	activityFilterHidesUnreads = false,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	onActivityFilterChange,
}: CategoryMenuProps) => {
	const { t } = useTranslation();
	const [isOpen, toggleOpen] = useToggle(false);
	const close = useCallback(() => toggleOpen(false), [toggleOpen]);

	const { openManage, openDelete } = useCategoryModals();
	const moveRoomCategory = useMoveRoomCategory();
	const { toggleShowUnreads, toggleKeepUnreadsOnTop } = useToggleUnreads();
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread', false);
	const disableAlwaysDisplay = Boolean(sidebarShowUnread) && groupKey !== 'Unread';

	const onCreateSuccess = async (rid: string, name?: string) => {
		if (!category) {
			return;
		}

		await moveRoomCategory.mutateAsync({ room: { rid, name, isFavorite: false }, target: category._id, silent: true });
	};

	const rawCreateItems = useCreateNewItems({ onCreateSuccess });
	const createItems = category ? rawCreateItems : [];

	const handleToggleShowUnreads = async () => toggleShowUnreads(category?._id ?? groupKey);
	const handleToggleKeepUnreadsOnTop = async () => toggleKeepUnreadsOnTop(category?._id ?? groupKey);

	const orderItems: GenericMenuItemProps[] = [
		{
			id: 'move-up',
			icon: 'arrow-up',
			content: t('Move_up'),
			disabled: !canMoveUp,
			onClick: () => {
				close();
				onMoveUp();
			},
		},
		{
			id: 'move-down',
			icon: 'arrow-down',
			content: t('Move_down'),
			disabled: !canMoveDown,
			onClick: () => {
				close();
				onMoveDown();
			},
		},
	];

	const manageItems: GenericMenuItemProps[] = category
		? [
				{
					id: 'manage',
					icon: 'cog',
					content: t('Manage'),
					onClick: () => {
						close();
						openManage(category);
					},
				},
				{
					id: 'delete',
					icon: 'trash',
					content: t('Delete'),
					onClick: () => {
						close();
						openDelete(category);
					},
				},
			]
		: [];

	const unreadItems: GenericMenuItemProps[] = [
		{
			id: 'show-unreads',
			icon: 'flag',
			content: t('Always_display'),
			onClick: handleToggleShowUnreads,
			addon: <ToggleSwitch disabled={disableAlwaysDisplay} checked={!disableAlwaysDisplay && showUnreads} onChange={() => undefined} />,
			disabled: disableAlwaysDisplay,
			tooltip: disableAlwaysDisplay ? t('Disabled_by_unread_group_see_display_options') : undefined,
		},
		{
			id: 'keep-unreads-on-top',
			icon: 'sort-amount-down',
			content: t('Keep_on_top'),
			onClick: handleToggleKeepUnreadsOnTop,
			addon: <ToggleSwitch disabled={sidebarShowUnread} checked={!sidebarShowUnread && keepUnreadsOnTop} onChange={() => undefined} />,
			disabled: sidebarShowUnread,
			tooltip: sidebarShowUnread ? t('Disabled_by_unread_group_see_display_options') : undefined,
		},
	];

	// Stable, so the filter items are rebuilt only when the group or its filter changes, not on every render.
	const handleActivityFilterChoice = useStableCallback((hours: number | undefined) => {
		close();
		onActivityFilterChange?.(hours);
	});
	const filterItems = useActivityFilterItems(groupKey, activityFilterHours, handleActivityFilterChoice);
	const hidesUnreadsItem = useActivityFilterHidesUnreadsItem(groupKey, activityFilterHours, activityFilterHidesUnreads);
	const activityFilterItems = isActivityFilterable(groupKey) ? [...filterItems, hidesUnreadsItem] : [];
	// The submenu checks the window in use and, when on, the unreads toggle; a toggle with no window is disabled.
	const activityFilterSelectedKeys = [
		getActivityFilterItemId(activityFilterHours),
		...(activityFilterHidesUnreads ? [ACTIVITY_FILTER_HIDES_UNREADS_ITEM_ID] : []),
	];
	const activityFilterDisabledKeys = hidesUnreadsItem.disabled ? [ACTIVITY_FILTER_HIDES_UNREADS_ITEM_ID] : [];
	const archiveItems = useArchiveRoomsItems({ groupKey, groupTitle, rooms, onOpen: close });

	const allItems = [
		...orderItems,
		...(category ? manageItems : []),
		...createItems,
		...activityFilterItems,
		...archiveItems,
		...unreadItems,
	];
	const disabledKeys = allItems.filter(({ disabled }) => disabled).map(({ id }) => id);

	const handleAction = useHandleMenuAction(allItems);

	return (
		<Menu
			icon='kebab'
			title={t('Options')}
			size='mini'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={toggleOpen}
			{...(disabledKeys.length ? { disabledKeys } : {})}
			onAction={handleAction}
		>
			{[
				<MenuSection key='main' aria-label={t('Options')}>
					<>
						{orderItems.map((item) => (
							<MenuItem key={item.id}>
								<GenericMenuItem {...item} />
							</MenuItem>
						))}
						{category && createItems.length > 0 && (
							<MenuSubmenuTrigger key='create-new' textValue={t('Create_new')}>
								<MenuItem aria-label={t('Create_new')}>
									<GenericMenuItem id='create-new' icon='plus' content={t('Create_new')} />
								</MenuItem>
								<MenuSection items={createItems}>
									{(item) => (
										<MenuItem key={item.id}>
											<GenericMenuItem {...item} />
										</MenuItem>
									)}
								</MenuSection>
							</MenuSubmenuTrigger>
						)}
						{category &&
							manageItems.map((item) => (
								<MenuItem key={item.id}>
									<GenericMenuItem {...item} />
								</MenuItem>
							))}
						{activityFilterItems.length > 0 && (
							<MenuSubmenuTrigger
								key='activity-filter'
								textValue={t('Filter')}
								selectionMode='multiple'
								selectedKeys={activityFilterSelectedKeys}
								disabledKeys={activityFilterDisabledKeys}
							>
								<MenuItem aria-label={t('Filter')}>
									<GenericMenuItem id='activity-filter' icon='clock' content={t('Filter')} />
								</MenuItem>
								<MenuSection items={filterItems}>
									{(item) => (
										<MenuItem key={item.id} textValue={typeof item.content === 'string' ? item.content : undefined}>
											<GenericMenuItem {...item} />
										</MenuItem>
									)}
								</MenuSection>
								<MenuSection items={[hidesUnreadsItem]}>
									{(item) => (
										<MenuItem key={item.id} textValue={typeof item.content === 'string' ? item.content : undefined}>
											<GenericMenuItem {...item} />
										</MenuItem>
									)}
								</MenuSection>
							</MenuSubmenuTrigger>
						)}
						{archiveItems.map((item) => (
							<MenuItem key={item.id}>
								<GenericMenuItem {...item} />
							</MenuItem>
						))}
					</>
				</MenuSection>,
				<MenuSection key='unreads' title={t('Unreads')} items={unreadItems}>
					{(item) => (
						<MenuItem key={item.id}>
							<GenericMenuItem {...item} />
						</MenuItem>
					)}
				</MenuSection>,
			]}
		</Menu>
	);
};

export default memo(CategoryMenu);
