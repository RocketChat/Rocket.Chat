import { roomActionHooks } from '../../../../ui';
import type { ToolboxActionConfig } from '../../lib/Toolbox/index';

export const useCoreRoomActions = () => {
	return roomActionHooks.map((roomActionHook) => roomActionHook()).filter((roomAction): roomAction is ToolboxActionConfig => !!roomAction);
};
