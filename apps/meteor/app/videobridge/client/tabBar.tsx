import React, { useMemo, lazy, ReactElement, ComponentProps } from 'react';
import { useStableArray, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Menu } from '@rocket.chat/fuselage';
import { useSetting, useSetModal, useUser, useTranslation, useLayout } from '@rocket.chat/ui-contexts';

import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { addAction, ToolboxActionConfig } from '../../../client/views/room/lib/Toolbox';
import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useTabBarOpen } from '../../../client/views/room/providers/ToolboxProvider';
import { useDispatchOutgoing, useDismissOutgoing, useStartCall } from '../../../client/contexts/VideoConfContext';

addAction('video-conf-list', {
	groups: ['channel', 'group', 'team'],
	id: 'video-conf-list',
	title: 'Video_Conferences',
	template: lazy(() => import('../../../client/views/room/contextualBar/VideoConference/VideoConfList')),
	renderOption: undefined,
	order: 9999,
});

addAction('video-conf', ({ room }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const startCall = useStartCall();
	const user = useUser();
	const openTabBar = useTabBarOpen();
	const { isMobile } = useLayout();

	const dispatchPopup = useDispatchOutgoing();
	const dismissPopup = useDismissOutgoing();

	const handleCloseVideoConf = useMutableCallback(() => setModal());
	const enabled = useSetting('VideoConf_Enabled');
	const enabledDMs = useSetting('VideoConf_Enable_DMs');
	const enabledChannel = useSetting('VideoConf_Enable_Channels');
	const enabledTeams = useSetting('VideoConf_Enable_Teams');
	const enabledGroups = useSetting('VideoConf_Enable_Groups');

	const enableOption = enabled && (!user?.username || !room.muted?.includes(user.username));

	const groups = useStableArray(
		[
			enabledDMs && 'direct',
			enabledDMs && 'direct_multiple',
			enabledGroups && 'group',
			enabledTeams && 'team',
			enabledChannel && 'channel',
		].filter(Boolean) as ToolboxActionConfig['groups'],
	);

	const handleStartConference = useMutableCallback((confTitle) => {
		startCall(room._id, confTitle);
		handleCloseVideoConf();

		if (room.t === 'd') {
			dispatchPopup({ rid: room._id });
			// TODO: remove VideoConfManager
			VideoConfManager.once('direct/stopped', () => {
				dismissPopup();
			});
		}
	});

	const handleOpenVideoConf = useMutableCallback((): void =>
		setModal(<StartVideoConfModal onConfirm={handleStartConference} room={room} onClose={handleCloseVideoConf} />),
	);

	// TODO: use translation
	const menuOptions: ComponentProps<typeof Menu>['options'] = useMemo(
		() => ({
			header: {
				type: 'heading',
				label: 'Video Conferencing',
			},
			start: {
				label: 'Start a call',
				action: (): void => handleOpenVideoConf(),
			},
			list: {
				label: 'See history',
				action: (): void => openTabBar('video-conf-list'),
			},
		}),
		[handleOpenVideoConf, openTabBar],
	);

	return useMemo(
		() =>
			enableOption
				? {
						groups,
						id: 'video-conference',
						title: 'Video Conference',
						icon: 'phone',
						renderAction: (): ReactElement => <Menu tiny={!isMobile} title={t('Video_Conference')} icon='phone' options={menuOptions} />,
						full: true,
						order: 4,
				  }
				: null,
		[groups, enableOption, menuOptions, t, isMobile],
	);
});
