import { useCallsRoomAction } from '../ee/client/hooks/roomActions/useCallsRoomAction';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [useAutotranslateRoomAction, useCallsRoomAction] satisfies (() => ToolboxActionConfig | undefined)[];
