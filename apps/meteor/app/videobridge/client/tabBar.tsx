import { useMemo, lazy } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { useVideoConfDispatchOutgoing, useVideoConfIsCalling, useVideoConfIsRinging } from '../../../client/contexts/VideoConfContext';
import type { ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { addAction } from '../../../client/views/room/lib/Toolbox';
import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { useVideoConfWarning } from '../../../client/views/room/contextualBar/VideoConference/useVideoConfWarning';
import { useHasLicenseModule } from '../../../ee/client/hooks/useHasLicenseModule';

addAction('calls', ({ room }) => {
	const hasLicense = useHasLicenseModule('videoconference-enterprise');
	const federated = isRoomFederated(room);

	return useMemo(
		() =>
			hasLicense
				? {
						groups: ['channel', 'group', 'team'],
						id: 'calls',
						icon: 'phone',
						title: 'Calls',
						...(federated && {
							'data-tooltip': 'Video_Call_unavailable_for_federation',
							'disabled': true,
						}),
						template: lazy(() => import('../../../client/views/room/contextualBar/VideoConference/VideoConfList')),
						order: 999,
				  }
				: null,
		[hasLicense, federated],
	);
});

addAction('start-call', ({ room }) => {
	const user = useUser();
	const dispatchWarning = useVideoConfWarning();
	const dispatchPopup = useVideoConfDispatchOutgoing();
	const isCalling = useVideoConfIsCalling();
	const isRinging = useVideoConfIsRinging();
	const federated = isRoomFederated(room);

	const ownUser = room.uids && room.uids.length === 1;

	// Only disable video conf if the settings are explicitly FALSE - any falsy value counts as true
	const enabledDMs = useSetting('VideoConf_Enable_DMs') !== false;
	const enabledChannel = useSetting('VideoConf_Enable_Channels') !== false;
	const enabledTeams = useSetting('VideoConf_Enable_Teams') !== false;
	const enabledGroups = useSetting('VideoConf_Enable_Groups') !== false;
	const enabledLiveChat = useSetting('Omnichannel_call_provider') === 'Jitsi';

	const live = room?.streamingOptions && room.streamingOptions.type === 'call';
	const enabled = enabledDMs || enabledChannel || enabledTeams || enabledGroups || enabledLiveChat;

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

	const handleOpenVideoConf = useMutableCallback(async (): Promise<void> => {
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

	return useMemo(
		() =>
			enableOption && !ownUser
				? {
						groups,
						id: 'start-call',
						title: 'Call',
						icon: 'phone',
						action: handleOpenVideoConf,
						...(federated && {
							'disabled': true,
							'data-tooltip': 'Video_Call_unavailable_for_federation',
						}),
						full: true,
						order: live ? -1 : 4,
				  }
				: null,
		[groups, enableOption, live, handleOpenVideoConf, ownUser, federated],
	);
});
