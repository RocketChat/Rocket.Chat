import { useStableArray } from '@rocket.chat/fuselage-hooks';

import { roomActionHooks } from '../../../../ui';
import type { ToolboxActionConfig } from '../../lib/Toolbox/index';

export const useCoreRoomActions = () => {
	return useStableArray(
		roomActionHooks.map((roomActionHook) => roomActionHook()).filter((roomAction): roomAction is ToolboxActionConfig => !!roomAction),
	);
};
