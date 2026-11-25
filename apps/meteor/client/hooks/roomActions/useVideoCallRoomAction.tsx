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
	useVideoConfWindowEnabled,
} from '@rocket.chat/ui-video-conf';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import VideoCallMenuWithData from '../../views/room/Header/VideoCallMenu/VideoCallMenuWithData';
import { useEmbeddedVideoConfProvider } from '../../views/room/Header/VideoCallMenu/useEmbeddedVideoConfProvider';
import { useRoom, useUserIsSubscribed } from '../../views/room/contexts/RoomContext';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useVideoCallRoomAction = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const subscribed = useUserIsSubscribed();
	const federated = isRoomFederated(room);

	const ownUser = room.uids?.length === 1 || false;

	const permittedToPostReadonly = usePermission('post-readonly', room._id);
	const permittedToCallManagement = usePermission('call-management', room._id);

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const startCall = useVideoConfStartCall();
	const preflight = useVideoConfWindowEnabled();
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
	const offersLinks = room.t !== 'l';
	const native = useEmbeddedVideoConfProvider(preflight && visible && offersLinks);
	const allowed = visible && permittedToCallManagement && (!user?.username || !room.muted?.includes(user.username)) && !ownUser;
	const unavailable = federated || (!!room.ro && !permittedToPostReadonly) || room.archived;
	// A room open only as a preview can't start a call: the call is the members', so the user is told to join first
	// rather than shown a call that fails. An omnichannel room is served by agents who need not have joined it.
	const mustJoin = !subscribed && room.t !== 'l';
	const disabled = unavailable || mustJoin;

	const tooltip =
		(unavailable ? t('core.Video_Call_unavailable_for_this_type_of_room') : undefined) ??
		(mustJoin ? t('Join_the_room_to_start_a_call') : undefined);

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

	const start = useStableCallback(() => {
		void handleOpenVideoConf();
	});

	return useMemo((): RoomToolboxActionConfig | undefined => {
		const item = {
			id: 'start-video-call',
			title: 'Video_call',
			icon: 'video',
			featured: true,
			order: 1,
			groups,
			disabled,
			tooltip,
		} as const;

		if (!native) {
			return allowed ? { ...item, action: start } : undefined;
		}

		// Members who may not start still reach the room's links through the menu.
		return {
			...item,
			...(allowed && { action: start }),
			renderToolboxItem: ({ id, title, icon, className }) => (
				<VideoCallMenuWithData
					key={id}
					rid={room._id}
					title={t(title)}
					icon={icon}
					className={className}
					canStart={allowed}
					canManage={permittedToCallManagement}
					startDisabled={disabled}
					startDisabledReason={tooltip}
					onStart={start}
				/>
			),
		};
	}, [native, allowed, groups, disabled, tooltip, start, room._id, t, permittedToCallManagement]);
};
