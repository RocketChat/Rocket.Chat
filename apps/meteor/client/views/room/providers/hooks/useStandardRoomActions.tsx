import { roomActions as enterpriseRoomActionHooks } from '../../../../../ee/client/ui';
import { roomActions as communityRoomActionHooks } from '../../../../ui';
import type { ToolboxAction } from '../../lib/Toolbox/index';

export const useStandardRoomActions = () => {
	return [...communityRoomActionHooks, ...enterpriseRoomActionHooks]
		.map((roomActionHook) => roomActionHook())
		.filter((roomAction): roomAction is ToolboxAction => !!roomAction);
};
