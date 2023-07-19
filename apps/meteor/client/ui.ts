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
import { useOmniChannelExternalFrameRoomAction } from './hooks/roomActions/useOmniChannelExternalFrameRoomAction';
import { useOutlookCalenderRoomAction } from './hooks/roomActions/useOutlookCalenderRoomAction';
import { usePinnedMessagesRoomAction } from './hooks/roomActions/usePinnedMessagesRoomAction';
import { usePushNotificationsRoomAction } from './hooks/roomActions/usePushNotificationsRoomAction';
import { useRocketSearchRoomAction } from './hooks/roomActions/useRocketSearchRoomAction';
import { useRoomInfoRoomAction } from './hooks/roomActions/useRoomInfoRoomAction';
import { useStarredMessagesRoomAction } from './hooks/roomActions/useStarredMessagesRoomAction';
import { useStartCallRoomAction } from './hooks/roomActions/useStartCallRoomAction';
import { useTeamChannelsRoomAction } from './hooks/roomActions/useTeamChannelsRoomAction';
import { useTeamInfoRoomAction } from './hooks/roomActions/useTeamInfoRoomAction';
import { useThreadRoomAction } from './hooks/roomActions/useThreadRoomAction';
import { useUploadedFilesListRoomAction } from './hooks/roomActions/useUploadedFilesListRoomAction';
import { useUserInfoGroupRoomAction } from './hooks/roomActions/useUserInfoGroupRoomAction';
import { useUserInfoRoomAction } from './hooks/roomActions/useUserInfoRoomAction';
import { useVoIPRoomInfoRoomAction } from './hooks/roomActions/useVoIPRoomInfoRoomAction';
import { useWebRTCVideoRoomAction } from './hooks/roomActions/useWebRTCVideoRoomAction';
import type { ToolboxAction } from './views/room/lib/Toolbox';

export const roomActions = [
	// Community
	useAutotranslateRoomAction,
	useChannelSettingsRoomAction,
	useCleanHistoryRoomAction,
	useContactChatHistoryRoomAction,
	useContactProfileRoomAction,
	useDiscussionsRoomAction,
	useE2EERoomAction,
	useExportMessagesRoomAction,
	useKeyboardShortcutListRoomAction,
	useMembersListRoomAction,
	useMentionsRoomAction,
	useOTRRoomAction,
	useOmniChannelExternalFrameRoomAction,
	useOutlookCalenderRoomAction,
	usePinnedMessagesRoomAction,
	usePushNotificationsRoomAction,
	useRocketSearchRoomAction,
	useRoomInfoRoomAction,
	useStarredMessagesRoomAction,
	useStartCallRoomAction,
	useTeamChannelsRoomAction,
	useTeamInfoRoomAction,
	useThreadRoomAction,
	useUploadedFilesListRoomAction,
	useUserInfoGroupRoomAction,
	useUserInfoRoomAction,
	useVoIPRoomInfoRoomAction,
	useWebRTCVideoRoomAction,

	// Enterprise
	useCallsRoomAction,
	useCannedResponsesRoomAction,
	useGameCenterRoomAction,
] satisfies (() => ToolboxAction | undefined)[];
