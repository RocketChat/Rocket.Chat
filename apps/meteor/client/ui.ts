import { useCallsRoomAction } from '../ee/client/hooks/roomActions/useCallsRoomAction';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useStartCallRoomAction } from './hooks/roomActions/useStartCallRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [useAutotranslateRoomAction, useCallsRoomAction, useStartCallRoomAction] satisfies (() =>
	| ToolboxActionConfig
	| undefined)[];
