import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useLayout } from '@rocket.chat/ui-contexts';

import { useSidePanelParentRid } from './useSidePanelParentRid';
import type { AllGroupsKeysWithUnread, AllGroupsKeys } from '../contexts/RoomsNavigationContext';
import { SIDE_PANEL_GROUPS, getFilterKey } from '../contexts/RoomsNavigationContext';

export const useSidePanelFilters = () => {
	const {
		sidePanel: { openSidePanel },
	} = useLayout();
	const { setParentRoom } = useSidePanelParentRid();
	const [currentFilter, setCurrentFilter] = useLocalStorage<AllGroupsKeysWithUnread>(
		'sidePanelFilters',
		getFilterKey(SIDE_PANEL_GROUPS.ALL, false),
	);

	const setFilter = useEffectEvent((filter: AllGroupsKeys, unread: boolean, parentRid?: IRoom['_id']) => {
		openSidePanel();
		setCurrentFilter(getFilterKey(filter, unread));
		setParentRoom(filter, parentRid);
	});

	return { currentFilter, setFilter };
};
