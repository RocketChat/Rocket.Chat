import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

import { useRoom } from '../../views/room/contexts/RoomContext';
import { ABAC_ATTRIBUTES_TAB } from '../../views/room/contextualBar/AbacAttributes/abacAttributesTab';
import { useCanManageRoomAbacAttributes } from '../../views/room/hooks/useCanManageRoomAbacAttributes';

const AbacAttributes = lazy(() => import('../../views/room/contextualBar/AbacAttributes'));

export const useAbacAttributesRoomAction = () => {
	const room = useRoom();
	const canManage = useCanManageRoomAbacAttributes(room);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!canManage) {
			return undefined;
		}

		return {
			id: ABAC_ATTRIBUTES_TAB,
			groups: ['group', 'team'],
			title: 'ABAC_Attribute_based_access_control',
			icon: 'shield',
			tabComponent: AbacAttributes,
			order: 7.5,
		};
	}, [canManage]);
};
