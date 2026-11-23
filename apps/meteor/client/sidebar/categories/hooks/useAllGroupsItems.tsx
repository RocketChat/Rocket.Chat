import { Icon, ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ACTIVITY_FILTER_PRESETS } from './useActivityFilterItems';
import { useAllGroupsSettings } from './useAllGroupsSettings';

export const ALL_GROUPS_SHOW_UNREADS_ITEM_ID = 'all-groups-show-unreads';
export const ALL_GROUPS_KEEP_UNREADS_ON_TOP_ITEM_ID = 'all-groups-keep-unreads-on-top';

/** The menu item id of a window in the All groups submenu, `all` when there is none. */
export const getAllGroupsFilterItemId = (hours: number | undefined): string => `all-groups-filter-${hours ?? 'all'}`;

/**
 * The items of the "All groups" submenu in the Display menu: the activity filter windows, then the unread toggles,
 * each read across every group and written to all of them at once. While the groups disagree on a setting nothing
 * is checked for it.
 */
export const useAllGroupsItems = () => {
	const { t } = useTranslation();
	const { activityFilterHours, showUnreads, keepUnreadsOnTop, setActivityFilterHours, setShowUnreads, setKeepUnreadsOnTop } =
		useAllGroupsSettings();
	// With the Unread group on, the unread rooms are listed there instead, so the toggles have nothing to do.
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread', false);

	const filterItems = useMemo<GenericMenuItemProps[]>(
		() =>
			ACTIVITY_FILTER_PRESETS.map(({ hours, label }) => ({
				id: getAllGroupsFilterItemId(hours),
				content: t(label),
				onClick: () => setActivityFilterHours(hours),
				addon: !activityFilterHours.mixed && activityFilterHours.value === hours ? <Icon name='check' size='x16' /> : undefined,
			})),
		[t, activityFilterHours, setActivityFilterHours],
	);

	// The switches only show the state; the items themselves announce it, so they stay out of the tab order and the tree.
	const showUnreadsOn = !showUnreads.mixed && showUnreads.value;
	const keepUnreadsOnTopOn = !keepUnreadsOnTop.mixed && keepUnreadsOnTop.value;

	const unreadItems = useMemo<GenericMenuItemProps[]>(
		() => [
			{
				id: ALL_GROUPS_SHOW_UNREADS_ITEM_ID,
				icon: 'flag',
				content: t('Always_display'),
				onClick: () => setShowUnreads(!showUnreadsOn),
				addon: (
					<ToggleSwitch
						inert
						aria-hidden
						tabIndex={-1}
						disabled={sidebarShowUnread}
						checked={!sidebarShowUnread && showUnreadsOn}
						onChange={() => undefined}
					/>
				),
				disabled: sidebarShowUnread,
				tooltip: sidebarShowUnread ? t('Disabled_by_unread_group_see_display_options') : undefined,
			},
			{
				id: ALL_GROUPS_KEEP_UNREADS_ON_TOP_ITEM_ID,
				icon: 'sort-amount-down',
				content: t('Keep_on_top'),
				onClick: () => setKeepUnreadsOnTop(!keepUnreadsOnTopOn),
				addon: (
					<ToggleSwitch
						inert
						aria-hidden
						tabIndex={-1}
						disabled={sidebarShowUnread}
						checked={!sidebarShowUnread && keepUnreadsOnTopOn}
						onChange={() => undefined}
					/>
				),
				disabled: sidebarShowUnread,
				tooltip: sidebarShowUnread ? t('Disabled_by_unread_group_see_display_options') : undefined,
			},
		],
		[t, sidebarShowUnread, showUnreadsOn, keepUnreadsOnTopOn, setShowUnreads, setKeepUnreadsOnTop],
	);

	// The submenu checks the window every group shares and the toggles that are on everywhere.
	const selectedKeys = [
		...(activityFilterHours.mixed ? [] : [getAllGroupsFilterItemId(activityFilterHours.value)]),
		...(showUnreadsOn && !sidebarShowUnread ? [ALL_GROUPS_SHOW_UNREADS_ITEM_ID] : []),
		...(keepUnreadsOnTopOn && !sidebarShowUnread ? [ALL_GROUPS_KEEP_UNREADS_ON_TOP_ITEM_ID] : []),
	];
	const disabledKeys = sidebarShowUnread ? [ALL_GROUPS_SHOW_UNREADS_ITEM_ID, ALL_GROUPS_KEEP_UNREADS_ON_TOP_ITEM_ID] : [];

	return { filterItems, unreadItems, selectedKeys, disabledKeys };
};
