import { isRoomFederated } from '@rocket.chat/core-typings';
import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomContext } from '../../views/room/contexts/RoomContext';
import { useHasLicenseModule } from '../useHasLicenseModule';

const VideoConfList = lazy(() => import('../../views/room/contextualBar/VideoConference/VideoConfList'));

export const useCallsRoomAction = () => {
	const { data: licensed = false } = useHasLicenseModule('videoconference-enterprise');
	const room = useContext(RoomContext)?.room;
	const federated = room ? isRoomFederated(room) : false;
	const { t } = useTranslation();

	return useMemo((): RoomToolboxActionConfig | undefined => {
		if (!licensed) {
			return undefined;
		}

		return {
			id: 'calls',
			groups: ['channel', 'group', 'team', 'direct', 'direct_multiple'],
			icon: 'phone',
			title: 'Calls',
			...(federated && {
				tooltip: t('core.Video_Call_unavailable_for_this_type_of_room'),
				disabled: true,
			}),
			tabComponent: VideoConfList,
			order: 999,
		};
	}, [licensed, federated, t]);
};
