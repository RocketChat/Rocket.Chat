import { isRoomFederated } from '@rocket.chat/core-typings';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUser, usePermission } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../contexts/VideoConfContext';
import { VideoConfManager } from '../../lib/VideoConfManager';
import { useRoom } from '../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

export const useStartCallRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);

	const ownUser = room.uids?.length === 1 ?? false;

	const permittedToPostReadonly = usePermission('post-readonly', room._id);
	const permittedToCallManagement = usePermission('call-management', room._id);

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();

	const { t } = useTranslation();

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

	const enabled = groups.length > 0;

	const user = useUser();

	const allowed = enabled && permittedToCallManagement && (!user?.username || !room.muted?.includes(user.username)) && !ownUser;

	const handleOpenVideoConf = useMutableCallback(async () => {
		if (isCalling || isRinging) {
			return;
		}

		try {
			await VideoConfManager.loadCapabilities();
			dispatchPopup({ rid: room._id });
		} catch (error: any) {
			dispatchWarning(error.error);
		}
	});

	const disabled = federated || (!!room.ro && !permittedToPostReadonly);

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!allowed) {
			return undefined;
		}

		return {
			id: 'start-call',
			groups,
			title: 'Call',
			icon: 'phone',
			action: () => void handleOpenVideoConf(),
			...(disabled && {
				tooltip: t('core.Video_Call_unavailable_for_this_type_of_room'),
				disabled: true,
			}),
			full: true,
			order: 4,
			featured: true,
		};
	}, [allowed, disabled, groups, handleOpenVideoConf, t]);
};
