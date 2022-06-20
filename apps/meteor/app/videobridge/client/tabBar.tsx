import React, { useMemo } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useSetModal, useUser } from '@rocket.chat/ui-contexts';

import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useVideoConfDispatchOutgoing, useVideoConfStartCall } from '../../../client/contexts/VideoConfContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';

// TODO: fix mocked config
addAction('video-conf', ({ room }) => {
	const setModal = useSetModal();
	const startCall = useVideoConfStartCall();
	const user = useUser();

	const dispatchPopup = useVideoConfDispatchOutgoing();

	const handleCloseVideoConf = useMutableCallback(() => setModal());
	const enabled = useSetting('VideoConf_Enabled');
	const enabledDMs = useSetting('VideoConf_Enable_DMs');
	const enabledChannel = useSetting('VideoConf_Enable_Channels');
	const enabledTeams = useSetting('VideoConf_Enable_Teams');
	const enabledGroups = useSetting('VideoConf_Enable_Groups');
	const enabledLiveChat = useSetting('Omnichannel_call_provider') === 'Jitsi';

	const live = room?.streamingOptions && room.streamingOptions.type === 'call';

	const enableOption = enabled && (!user?.username || !room.muted?.includes(user.username));

	const groups = useStableArray(
		[
			enabledDMs && 'direct',
			enabledDMs && 'direct_multiple',
			enabledGroups && 'group',
			enabledLiveChat && 'live',
			enabledTeams && 'team',
			enabledChannel && 'channel',
		].filter(Boolean) as ToolboxActionConfig['groups'],
	);

	const handleStartConference = useMutableCallback((confTitle) => {
		startCall(room._id, confTitle);
		handleCloseVideoConf();

		if (room.t === 'd') {
			dispatchPopup({ rid: room._id });
		}
	});

	const handleOpenVideoConf = useMutableCallback((): void =>
		setModal(<StartVideoConfModal onConfirm={handleStartConference} room={room} onClose={handleCloseVideoConf} />),
	);

	return useMemo(
		() =>
			enableOption
				? {
						groups,
						id: 'video-conference',
						title: 'Video Conference',
						icon: 'phone',
						action: handleOpenVideoConf,
						full: true,
						order: live ? -1 : 4,
				  }
				: null,
		[handleOpenVideoConf, groups, enableOption, live],
	);
});
