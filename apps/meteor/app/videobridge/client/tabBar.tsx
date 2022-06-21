import React, { useMemo, lazy, ReactElement, ComponentProps } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Menu } from '@rocket.chat/fuselage';
import { useSetting, useSetModal, useUser, useTranslation, useLayout } from '@rocket.chat/ui-contexts';

import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useVideoConfDispatchOutgoing, useVideoConfStartCall } from '../../../client/contexts/VideoConfContext';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import { useTabBarOpen } from '../../../client/views/room/providers/ToolboxProvider';

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
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();

	const dispatchPopup = useVideoConfDispatchOutgoing();
	const handleCloseVideoConf = useMutableCallback(() => setModal());

	const enabled = !useSetting('VideoConf_Disabled');
	const enabledDMs = !useSetting('VideoConf_Disable_DMs');
	const enabledChannel = !useSetting('VideoConf_Disable_Channels');
	const enabledTeams = !useSetting('VideoConf_Disable_Teams');
	const enabledGroups = !useSetting('VideoConf_Disable_Groups');
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

	const menuOptions: ComponentProps<typeof Menu>['options'] = useMemo(
		() => ({
			header: {
				type: 'heading',
				label: t('Video_Conference'),
			},
			start: {
				label: t('Call'),
				action: (): void => handleOpenVideoConf(),
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
