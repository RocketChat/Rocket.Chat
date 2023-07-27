import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [useAutotranslateRoomAction] satisfies (() => ToolboxActionConfig | undefined)[];
