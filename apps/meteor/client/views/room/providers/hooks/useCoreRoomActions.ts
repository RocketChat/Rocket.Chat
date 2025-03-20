import { useStableArray } from '@rocket.chat/fuselage-hooks';

import { roomActionHooks } from '../../../../ui';
import type { RoomToolboxActionConfig } from '../../contexts/RoomToolboxContext';

export const useCoreRoomActions = () => {
	return useStableArray(
		roomActionHooks.map((roomActionHook) => roomActionHook()).filter((roomAction): roomAction is RoomToolboxActionConfig => !!roomAction),
	);
};
