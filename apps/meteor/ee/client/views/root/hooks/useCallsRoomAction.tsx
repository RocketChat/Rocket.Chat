import { isRoomFederated } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { lazy, useContext, useEffect } from 'react';

import { ui } from '../../../../../client/lib/ui';
import { RoomContext } from '../../../../../client/views/room/contexts/RoomContext';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const VideoConfList = lazy(() => import('../../../../../client/views/room/contextualBar/VideoConference/VideoConfList'));

export const useCallsRoomAction = () => {
	const licensed = useHasLicenseModule('videoconference-enterprise') === true;
	const room = useContext(RoomContext)?.room;
	const federated = room ? isRoomFederated(room) : false;
	const t = useTranslation();

	useEffect(() => {
		if (!licensed) {
			return;
		}

		return ui.addRoomAction('calls', {
			groups: ['channel', 'group', 'team'],
			id: 'calls',
			icon: 'phone',
			title: 'Calls',
			...(federated && {
				'data-tooltip': t('Video_Call_unavailable_for_this_type_of_room'),
				'disabled': true,
			}),
			template: VideoConfList,
			order: 999,
		});
	}, [federated, licensed, t]);
};
