import { useCallsRoomAction } from '../ee/client/hooks/roomActions/useCallsRoomAction';
import { useCannedResponsesRoomAction } from '../ee/client/hooks/roomActions/useCannedResponsesRoomAction';
import { useGameCenterRoomAction } from '../ee/client/hooks/roomActions/useGameCenterRoomAction';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useChannelSettingsRoomAction } from './hooks/roomActions/useChannelSettingsRoomAction';
import { useCleanHistoryRoomAction } from './hooks/roomActions/useCleanHistoryRoomAction';
import { useStartCallRoomAction } from './hooks/roomActions/useStartCallRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [
	useAutotranslateRoomAction,
	useCallsRoomAction,
	useCannedResponsesRoomAction,
	useChannelSettingsRoomAction,
	useCleanHistoryRoomAction,
	useGameCenterRoomAction,
	useStartCallRoomAction,
] satisfies (() => ToolboxActionConfig | undefined)[];
