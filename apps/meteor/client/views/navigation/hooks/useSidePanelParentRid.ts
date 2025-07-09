import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent, useLocalStorage } from '@rocket.chat/fuselage-hooks';

import type { AllGroupsKeys } from '../contexts/RoomsNavigationContext';
import { SIDE_BAR_GROUPS } from '../contexts/RoomsNavigationContext';

export const useSidePanelParentRid = () => {
	const [parentRid, setParentRid] = useLocalStorage<IRoom['_id'] | undefined>('sidePanelParentRid', undefined);

	const setParentRoom = useEffectEvent((filter: AllGroupsKeys, parentRid: IRoom['_id'] | undefined) => {
		if (Object.values(SIDE_BAR_GROUPS).some((group) => filter === group)) {
			setParentRid(parentRid);
		}
	});

	return { parentRid, setParentRoom };
};
