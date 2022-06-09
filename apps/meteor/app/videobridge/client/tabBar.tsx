import React, { useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal } from '@rocket.chat/ui-contexts';

import { VideoConfManager } from '../../../client/lib/VideoConfManager';
import { addAction } from '../../../client/views/room/lib/Toolbox';
import StartVideoConfModal from '../../../client/views/room/contextualBar/VideoConference/StartVideoConfModal';
import { useVideoConfPopupDispatch, useStartCall, useVideoConfPopupDismiss } from '../../../client/contexts/VideoConfPopupContext';

// TODO: fix mocked config
addAction('video-conf', ({ room }) => {
	const setModal = useSetModal();
	const startCall = useStartCall();

	const dispatchPopup = useVideoConfPopupDispatch();
	const dismissPopup = useVideoConfPopupDismiss();

	const handleCloseVideoConf = useMutableCallback(() => setModal());

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

	return useMemo(
		() => ({
			groups: ['direct', 'group', 'channel'],
			id: 'video-conference',
			title: 'Video Conference',
			icon: 'phone',
			action: handleOpenVideoConf,
			full: true,
			order: 999,
		}),
		[handleOpenVideoConf],
	);
});
