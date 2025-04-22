import { useChatForwardQuickAction } from './hooks/quickActions/useChatForwardQuickAction';
import { useCloseChatQuickAction } from './hooks/quickActions/useCloseChatQuickAction';
import { useMoveQueueQuickAction } from './hooks/quickActions/useMoveQueueQuickAction';
import { useOnHoldChatQuickAction } from './hooks/quickActions/useOnHoldChatQuickAction';
import { useTranscriptQuickAction } from './hooks/quickActions/useTranscriptQuickAction';
import { useAppsRoomStarActions } from './hooks/roomActions/useAppsRoomStarActions';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useCallsRoomAction } from './hooks/roomActions/useCallsRoomAction';
import { useCannedResponsesRoomAction } from './hooks/roomActions/useCannedResponsesRoomAction';
import { useChannelSettingsRoomAction } from './hooks/roomActions/useChannelSettingsRoomAction';
import { useCleanHistoryRoomAction } from './hooks/roomActions/useCleanHistoryRoomAction';
import { useContactProfileRoomAction } from './hooks/roomActions/useContactProfileRoomAction';
import { useDiscussionsRoomAction } from './hooks/roomActions/useDiscussionsRoomAction';
import { useE2EERoomAction } from './hooks/roomActions/useE2EERoomAction';
import { useExportMessagesRoomAction } from './hooks/roomActions/useExportMessagesRoomAction';
import { useGameCenterRoomAction } from './hooks/roomActions/useGameCenterRoomAction';
import { useKeyboardShortcutListRoomAction } from './hooks/roomActions/useKeyboardShortcutListRoomAction';
import { useMembersListRoomAction } from './hooks/roomActions/useMembersListRoomAction';
import { useMentionsRoomAction } from './hooks/roomActions/useMentionsRoomAction';
import { useOTRRoomAction } from './hooks/roomActions/useOTRRoomAction';
import { useOmnichannelExternalFrameRoomAction } from './hooks/roomActions/useOmnichannelExternalFrameRoomAction';
import { useOutlookCalenderRoomAction } from './hooks/roomActions/useOutlookCalenderRoomAction';
import { usePinnedMessagesRoomAction } from './hooks/roomActions/usePinnedMessagesRoomAction';
import { usePushNotificationsRoomAction } from './hooks/roomActions/usePushNotificationsRoomAction';
import { useRocketSearchRoomAction } from './hooks/roomActions/useRocketSearchRoomAction';
import { useRoomInfoRoomAction } from './hooks/roomActions/useRoomInfoRoomAction';
import { useStarredMessagesRoomAction } from './hooks/roomActions/useStarredMessagesRoomAction';
import { useTeamChannelsRoomAction } from './hooks/roomActions/useTeamChannelsRoomAction';
import { useTeamInfoRoomAction } from './hooks/roomActions/useTeamInfoRoomAction';
import { useThreadRoomAction } from './hooks/roomActions/useThreadRoomAction';
import { useUploadedFilesListRoomAction } from './hooks/roomActions/useUploadedFilesListRoomAction';
import { useUserInfoGroupRoomAction } from './hooks/roomActions/useUserInfoGroupRoomAction';
import { useUserInfoRoomAction } from './hooks/roomActions/useUserInfoRoomAction';
import { useVideoCallRoomAction } from './hooks/roomActions/useVideoCallRoomAction';
import { useVoIPRoomInfoRoomAction } from './hooks/roomActions/useVoIPRoomInfoRoomAction';
import { useVoiceCallRoomAction } from './hooks/roomActions/useVoiceCallRoomAction';
import { useWebRTCVideoRoomAction } from './hooks/roomActions/useWebRTCVideoRoomAction';
import type { RoomToolboxActionConfig } from './views/room/contexts/RoomToolboxContext';
import type { QuickActionsActionConfig } from './views/room/lib/quickActions';

export const roomActionHooks = [
	useChannelSettingsRoomAction,
	useTeamInfoRoomAction,
	useUserInfoGroupRoomAction,
	useUserInfoRoomAction,
	useThreadRoomAction,
	useAutotranslateRoomAction,
	useCallsRoomAction,
	useCannedResponsesRoomAction,
	useCleanHistoryRoomAction,
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
	useOutlookCalenderRoomAction,
	usePinnedMessagesRoomAction,
	usePushNotificationsRoomAction,
	useRocketSearchRoomAction,
	useRoomInfoRoomAction,
	useStarredMessagesRoomAction,
	useTeamChannelsRoomAction,
	useUploadedFilesListRoomAction,
	useVoIPRoomInfoRoomAction,
	useWebRTCVideoRoomAction,
	useAppsRoomStarActions,
	useVideoCallRoomAction,
	useVoiceCallRoomAction,
] satisfies (() => RoomToolboxActionConfig | undefined)[];

export const quickActionHooks = [
	useMoveQueueQuickAction,
	useChatForwardQuickAction,
	useTranscriptQuickAction,
	useCloseChatQuickAction,
	useOnHoldChatQuickAction,
] satisfies (() => QuickActionsActionConfig | undefined)[];

export const roomActionHooksForE2EESetup = [useChannelSettingsRoomAction, useMembersListRoomAction, useE2EERoomAction];
