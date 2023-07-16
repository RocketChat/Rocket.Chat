import { isRoomFederated } from '@rocket.chat/core-typings';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUser, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../contexts/VideoConfContext';
import { VideoConfManager } from '../../lib/VideoConfManager';
import { ui } from '../../lib/ui';
import { useRoom } from '../../views/room/contexts/RoomContext';
import { useVideoConfWarning } from '../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';
import type { ToolboxAction } from '../../views/room/lib/Toolbox';

export const useStartCallRoomAction = () => {
	const room = useRoom();
	const federated = isRoomFederated(room);

	const ownUser = room.uids?.length === 1 ?? false;
	const live = room?.streamingOptions?.type === 'call' ?? false;

	const permittedToPostReadonly = usePermission('post-readonly', room._id);
	const permittedToCallManagement = usePermission('call-management', room._id);

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();

	const t = useTranslation();

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
		].filter((group): group is ToolboxAction['groups'][number] => !!group),
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

	useEffect(() => {
		if (!allowed) {
			return;
		}

		return ui.addRoomAction('start-call', {
			groups,
			id: 'start-call',
			title: 'Call',
			icon: 'phone',
			action: () => void handleOpenVideoConf(),
			...(disabled && {
				'data-tooltip': t('Video_Call_unavailable_for_this_type_of_room'),
				'disabled': true,
			}),
			full: true,
			order: live ? -1 : 4,
			featured: true,
		});
	}, [allowed, disabled, groups, handleOpenVideoConf, live, t]);
};
