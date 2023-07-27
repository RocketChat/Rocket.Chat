import { useCallsRoomAction } from '../ee/client/hooks/roomActions/useCallsRoomAction';
import { useCannedResponsesRoomAction } from '../ee/client/hooks/roomActions/useCannedResponsesRoomAction';
import { useGameCenterRoomAction } from '../ee/client/hooks/roomActions/useGameCenterRoomAction';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useChannelSettingsRoomAction } from './hooks/roomActions/useChannelSettingsRoomAction';
import { useCleanHistoryRoomAction } from './hooks/roomActions/useCleanHistoryRoomAction';
import { useContactChatHistoryRoomAction } from './hooks/roomActions/useContactChatHistoryRoomAction';
import { useContactProfileRoomAction } from './hooks/roomActions/useContactProfileRoomAction';
import { useDiscussionsRoomAction } from './hooks/roomActions/useDiscussionsRoomAction';
import { useE2EERoomAction } from './hooks/roomActions/useE2EERoomAction';
import { useExportMessagesRoomAction } from './hooks/roomActions/useExportMessagesRoomAction';
import { useKeyboardShortcutListRoomAction } from './hooks/roomActions/useKeyboardShortcutListRoomAction';
import { useMembersListRoomAction } from './hooks/roomActions/useMembersListRoomAction';
import { useMentionsRoomAction } from './hooks/roomActions/useMentionsRoomAction';
import { useOTRRoomAction } from './hooks/roomActions/useOTRRoomAction';
import { useOmnichannelExternalFrameRoomAction } from './hooks/roomActions/useOmnichannelExternalFrameRoomAction';
import { useStartCallRoomAction } from './hooks/roomActions/useStartCallRoomAction';
import { useUserInfoGroupRoomAction } from './hooks/roomActions/useUserInfoGroupRoomAction';
import { useUserInfoRoomAction } from './hooks/roomActions/useUserInfoRoomAction';
import type { ToolboxActionConfig } from './views/room/lib/Toolbox';

export const roomActionHooks = [
	useAutotranslateRoomAction,
	useCallsRoomAction,
	useCannedResponsesRoomAction,
	useChannelSettingsRoomAction,
	useCleanHistoryRoomAction,
	useContactChatHistoryRoomAction,
	useContactProfileRoomAction,
	useDiscussionsRoomAction,
	useE2EERoomAction,
	useExportMessagesRoomAction,
	useGameCenterRoomAction,
	useKeyboardShortcutListRoomAction,
	useMembersListRoomAction,
	useMentionsRoomAction,
	useOTRRoomAction,
	useOmnichannelExternalFrameRoomAction,
	useStartCallRoomAction,
	useUserInfoGroupRoomAction,
	useUserInfoRoomAction,
] satisfies (() => ToolboxActionConfig | undefined)[];
