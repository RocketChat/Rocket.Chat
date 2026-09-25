import { useStableArray } from '@rocket.chat/fuselage-hooks';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import { roomActionHooks } from '../../../../ui';

// Calls a static list of hooks through a callback, which React Compiler would memoize into one call; `'use no memo'` opts it out.
export const useCoreRoomActions = () => {
	'use no memo';

	return useStableArray(
		roomActionHooks.map((roomActionHook) => roomActionHook()).filter((roomAction): roomAction is RoomToolboxActionConfig => !!roomAction),
	);
};
