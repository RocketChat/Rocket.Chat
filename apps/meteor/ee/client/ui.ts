import type { ToolboxAction } from '../../client/views/room/lib/Toolbox';
import { useCallsRoomAction } from './hooks/roomActions/useCallsRoomAction';
import { useCannedResponsesRoomAction } from './hooks/roomActions/useCannedResponsesRoomAction';
import { useGameCenterRoomAction } from './hooks/roomActions/useGameCenterRoomAction';

export const roomActions = [useCallsRoomAction, useCannedResponsesRoomAction, useGameCenterRoomAction] satisfies (() =>
	| ToolboxAction
	| undefined)[];
