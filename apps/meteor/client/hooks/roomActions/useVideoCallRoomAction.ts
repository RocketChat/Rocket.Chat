import { isRoomFederated } from '@rocket.chat/core-typings';
import { useStableCallback, useStableArray } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import {
	useVideoConfDispatchOutgoing,
	useVideoConfIsCalling,
	useVideoConfIsRinging,
	useVideoConfLoadCapabilities,
	useVideoConfStartCall,
} from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../../views/room/contexts/RoomContext';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useVideoCallRoomAction = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const federated = isRoomFederated(room);

	const ownUser = room.uids?.length === 1 || false;

	const permittedToPostReadonly = usePermission('post-readonly', room._id);
	const permittedToCallManagement = usePermission('call-management', room._id);

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const startCall = useVideoConfStartCall();
	const preflight = useSetting('VideoConf_Enable_Persistent_Chat', false);
	const loadCapabilities = useVideoConfLoadCapabilities();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();

	const enabledForDMs = useSetting('VideoConf_Enable_DMs', true);
	const enabledForChannels = useSetting('VideoConf_Enable_Channels', true);
	const enabledForTeams = useSetting('VideoConf_Enable_Teams', true);
	const enabledForGroups = useSetting('VideoConf_Enable_Groups', true);
	const enabledForLiveChat = useSetting('Omnichannel_call_provider', 'default-provider') === 'default-provider';

	const groups = useStableArray(
		[
			enabledForDMs && 'direct',
			enabledForDMs && 'direct_multiple',
			enabledForGroups && 'group',
			enabledForLiveChat && 'live',
			enabledForTeams && 'team',
			enabledForChannels && 'channel',
		].filter((group): group is RoomToolboxActionConfig['groups'][number] => !!group),
	);

	const visible = groups.length > 0;
	const allowed = visible && permittedToCallManagement && (!user?.username || !room.muted?.includes(user.username)) && !ownUser;
	const disabled = federated || (!!room.ro && !permittedToPostReadonly) || room.archived;
	const tooltip = disabled ? t('core.Video_Call_unavailable_for_this_type_of_room') : undefined;

	const handleOpenVideoConf = useStableCallback(async () => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			// Still asked for, because it is what fails when no provider is available — that error belongs here,
			// before a window opens, not inside one.
			await loadCapabilities();

			// The call window asks before it starts anything, so a popup asking the same thing first is one
			// confirmation too many. Without a preflight to ask, the popup is still where mic and camera are set.
			if (preflight) {
				startCall(room._id);
				return;
			}

			dispatchPopup({ rid: room._id });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'start-video-call',
			title: 'Video_call',
			icon: 'video',
			featured: true,
			action: handleOpenVideoConf,
			order: 1,
			groups,
			disabled,
			tooltip,
		};
	}, [allowed, groups, disabled, handleOpenVideoConf, tooltip]);
};
