import React, { useMemo, lazy, ReactElement, ComponentProps } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Menu } from '@rocket.chat/fuselage';
import { useSetting, useSetModal, useUser, useTranslation, useLayout } from '@rocket.chat/ui-contexts';

import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useVideoConfDispatchOutgoing, useVideoConfStartCall } from '../../../client/contexts/VideoConfContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { useTabBarOpen } from '../../../client/views/room/providers/ToolboxProvider';
import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { useVideoConfWarning } from '../../../client/views/room/contextualBar/VideoConference/useVideoConfWarning';

addAction('video-conf-list', {
	groups: ['channel', 'group', 'team'],
	id: 'video-conf-list',
	icon: 'video',
	title: 'Video_Conferences',
	template: lazy(() => import('../../../client/views/room/contextualBar/VideoConference/VideoConfList')),
	order: 9999,
});

addAction('video-conf', ({ room }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const startCall = useVideoConfStartCall();
	const user = useUser();
	const dispatchWarning = useVideoConfWarning();

	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();

	const dispatchPopup = useVideoConfDispatchOutgoing();
	const handleCloseVideoConf = useMutableCallback(() => setModal());
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

	const handleStartConference = useMutableCallback((confTitle) => {
		startCall(room._id, confTitle);
		handleCloseVideoConf();

		if (room.t === 'd') {
			dispatchPopup({ rid: room._id });
		}
	});

	const handleOpenVideoConf = useMutableCallback(async (): Promise<void> => {
		try {
			await VideoConfManager.loadCapabilities();
			setModal(<StartVideoConfModal onConfirm={handleStartConference} room={room} onClose={handleCloseVideoConf} />);
		} catch (error) {
			dispatchWarning(error.error);
		}
	});

	const menuOptions: ComponentProps<typeof Menu>['options'] = useMemo(
		() => ({
			header: {
				type: 'heading',
				label: t('Video_Conference'),
			},
			start: {
				label: t('Call'),
				action: (): Promise<void> => handleOpenVideoConf(),
			},
			...(['c', 'p'].includes(room.t) && {
				list: {
					label: t('See_history'),
					action: (): void => openTabBar('video-conf-list'),
				},
			}),
		}),
		[handleOpenVideoConf, openTabBar, room.t, t],
	);

	return useMemo(
		() =>
			enableOption
				? {
						groups,
						id: 'video-conference',
						title: 'Video_Conference',
						icon: 'phone',
						renderAction: (): ReactElement => <Menu tiny={!isMobile} title={t('Video_Conference')} icon='phone' options={menuOptions} />,
						full: true,
						order: live ? -1 : 4,
				  }
				: null,
		[t, groups, enableOption, live, isMobile, menuOptions],
	);
});
