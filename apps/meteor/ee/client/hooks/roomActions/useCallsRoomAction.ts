import { isRoomFederated } from '@rocket.chat/core-typings';
import { lazy, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomContext } from '../../../../client/views/room/contexts/RoomContext';
import type { ToolboxActionConfig } from '../../../../client/views/room/lib/Toolbox';
import { useHasLicenseModule } from '../useHasLicenseModule';

const VideoConfList = lazy(() => import('../../../../client/views/room/contextualBar/VideoConference/VideoConfList'));

export const useCallsRoomAction = (): ToolboxActionConfig | undefined => {
	const licensed = useHasLicenseModule('videoconference-enterprise') === true;
	const room = useContext(RoomContext)?.room;
	const federated = room ? isRoomFederated(room) : false;
	const { t } = useTranslation();

	return useMemo(() => {
		if (!licensed) {
			return undefined;
		}

		return {
			id: 'calls',
			groups: ['channel', 'group', 'team'],
			icon: 'phone',
			title: 'Calls',
			...(federated && {
				tooltip: t('core.Video_Call_unavailable_for_this_type_of_room'),
				disabled: true,
			}),
			template: VideoConfList,
			order: 999,
		};
	}, [licensed, federated, t]);
};
