import { useStableArray } from '@rocket.chat/fuselage-hooks';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import { roomActionHooks } from '../../../../ui';

export const useCoreRoomActions = () => {
	return useStableArray(
		roomActionHooks.map((roomActionHook) => roomActionHook()).filter((roomAction): roomAction is RoomToolboxActionConfig => !!roomAction),
	);
};
