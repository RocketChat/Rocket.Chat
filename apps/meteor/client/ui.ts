import { useCallsRoomAction } from '../ee/client/hooks/roomActions/useCallsRoomAction';
import { useCannedResponsesRoomAction } from '../ee/client/hooks/roomActions/useCannedResponsesRoomAction';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useStartCallRoomAction } from './hooks/roomActions/useStartCallRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [
	useAutotranslateRoomAction,
	useCallsRoomAction,
	useCannedResponsesRoomAction,
	useStartCallRoomAction,
] satisfies (() => ToolboxActionConfig | undefined)[];
