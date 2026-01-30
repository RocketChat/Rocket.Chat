import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';

import { useChatForwardQuickAction } from './hooks/quickActions/useChatForwardQuickAction';
import { useCloseChatQuickAction } from './hooks/quickActions/useCloseChatQuickAction';
import { useMoveQueueQuickAction } from './hooks/quickActions/useMoveQueueQuickAction';
import { useOnHoldChatQuickAction } from './hooks/quickActions/useOnHoldChatQuickAction';
import { useTranscriptQuickAction } from './hooks/quickActions/useTranscriptQuickAction';
import { useAppsRoomStarActions } from './hooks/roomActions/useAppsRoomStarActions';
import { useAutotranslateRoomAction } from './hooks/roomActions/useAutotranslateRoomAction';
import { useCallsRoomAction } from './hooks/roomActions/useCallsRoomAction';
import { useChannelSettingsRoomAction } from './hooks/roomActions/useChannelSettingsRoomAction';
import { useCleanHistoryRoomAction } from './hooks/roomActions/useCleanHistoryRoomAction';
import { useDiscussionsRoomAction } from './hooks/roomActions/useDiscussionsRoomAction';
import { useE2EERoomAction } from './hooks/roomActions/useE2EERoomAction';
import { useExportMessagesRoomAction } from './hooks/roomActions/useExportMessagesRoomAction';
import { useGameCenterRoomAction } from './hooks/roomActions/useGameCenterRoomAction';
import { useKeyboardShortcutListRoomAction } from './hooks/roomActions/useKeyboardShortcutListRoomAction';
import { useMediaCallRoomAction } from './hooks/roomActions/useMediaCallRoomAction';
import { useMembersListRoomAction } from './hooks/roomActions/useMembersListRoomAction';
import { useMentionsRoomAction } from './hooks/roomActions/useMentionsRoomAction';
import { useOutlookCalenderRoomAction } from './hooks/roomActions/useOutlookCalenderRoomAction';
import { usePinnedMessagesRoomAction } from './hooks/roomActions/usePinnedMessagesRoomAction';
import { usePushNotificationsRoomAction } from './hooks/roomActions/usePushNotificationsRoomAction';
import { useRocketSearchRoomAction } from './hooks/roomActions/useRocketSearchRoomAction';
import { useStarredMessagesRoomAction } from './hooks/roomActions/useStarredMessagesRoomAction';
import { useTeamChannelsRoomAction } from './hooks/roomActions/useTeamChannelsRoomAction';
import { useTeamInfoRoomAction } from './hooks/roomActions/useTeamInfoRoomAction';
import { useThreadRoomAction } from './hooks/roomActions/useThreadRoomAction';
import { useUploadedFilesListRoomAction } from './hooks/roomActions/useUploadedFilesListRoomAction';
import { useUserInfoGroupRoomAction } from './hooks/roomActions/useUserInfoGroupRoomAction';
import { useUserInfoRoomAction } from './hooks/roomActions/useUserInfoRoomAction';
import { useVideoCallRoomAction } from './hooks/roomActions/useVideoCallRoomAction';
import { useCannedResponsesRoomAction } from './views/omnichannel/hooks/useCannedResponsesRoomAction';
import { useContactProfileRoomAction } from './views/omnichannel/hooks/useContactProfileRoomAction';
import { useOmnichannelExternalFrameRoomAction } from './views/omnichannel/hooks/useOmnichannelExternalFrameRoomAction';
import { useRoomInfoRoomAction } from './views/omnichannel/hooks/useRoomInfoRoomAction';
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
	useOmnichannelExternalFrameRoomAction,
	useOutlookCalenderRoomAction,
	usePinnedMessagesRoomAction,
	usePushNotificationsRoomAction,
	useRocketSearchRoomAction,
	useRoomInfoRoomAction,
	useStarredMessagesRoomAction,
	useTeamChannelsRoomAction,
	useUploadedFilesListRoomAction,
	useAppsRoomStarActions,
	useVideoCallRoomAction,
	useMediaCallRoomAction,
] satisfies (() => RoomToolboxActionConfig | undefined)[];

export const quickActionHooks = [
	useMoveQueueQuickAction,
	useChatForwardQuickAction,
	useTranscriptQuickAction,
	useCloseChatQuickAction,
	useOnHoldChatQuickAction,
] satisfies (() => QuickActionsActionConfig | undefined)[];

export const roomActionHooksForE2EESetup = [useChannelSettingsRoomAction, useMembersListRoomAction, useE2EERoomAction];
