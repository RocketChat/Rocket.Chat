import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';

import { collapsibleFilters, type AllGroupsKeys } from '../contexts/RoomsNavigationContext';

export const useSidePanelParentRid = () => {
	const [parentRid, setParentRid] = useLocalStorage<IRoom['_id'] | undefined>('sidePanelParentRid', undefined);

	const setParentRoom = useEffectEvent((filter: AllGroupsKeys, parentRid: IRoom['_id'] | undefined) => {
		if (collapsibleFilters.some((group) => filter === group)) {
			setParentRid(parentRid);
		}
	});

	return { parentRid, setParentRoom };
};
