import { isOmnichannelRoom, isRoomFederated } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useEffectEvent, useStableArray } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../../contexts/VideoConfContext';
import { VideoConfManager } from '../../../lib/VideoConfManager';
import { useRoom } from '../../../views/room/contexts/RoomContext';
import type { RoomToolboxActionConfig } from '../../../views/room/contexts/RoomToolboxContext';
import { useVideoConfWarning } from '../../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning';

const useVideoConfMenuOptions = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const user = useUser();
	const federated = isRoomFederated(room);

	const ownUser = room.uids?.length === 1 || false;

	const permittedToPostReadonly = usePermission('post-readonly', room._id);
	const permittedToCallManagement = usePermission('call-management', room._id);

	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
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
	const disabled = federated || (!!room.ro && !permittedToPostReadonly);
	const tooltip = disabled ? t('core.Video_Call_unavailable_for_this_type_of_room') : '';
	const order = isOmnichannelRoom(room) ? -1 : 4;

	const handleOpenVideoConf = useEffectEvent(async () => {
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

	return useMemo(() => {
		const items: GenericMenuItemProps[] = [
			{
				id: 'start-video-call',
				icon: 'video',
				disabled,
				onClick: handleOpenVideoConf,
				content: (
					<Box is='span' title={tooltip}>
						{t('Video_call')}
					</Box>
				),
			},
		];

		return {
			items,
			disabled,
			allowed,
			order,
			groups,
		};
	}, [allowed, disabled, groups, handleOpenVideoConf, order, t, tooltip]);
};

export default useVideoConfMenuOptions;
