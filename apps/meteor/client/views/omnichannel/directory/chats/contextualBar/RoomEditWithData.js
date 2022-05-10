import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import VisitorData from './VisitorData';

function RoomEditWithData({ id, reload, reloadInfo, close }) {
	const t = useTranslation();

	const { value: roomData, phase: state, error } = useEndpointData(`rooms.info?roomId=${id}`);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || !roomData || !roomData.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return <VisitorData room={roomData} reload={reload} reloadInfo={reloadInfo} close={close} />;
}

export default RoomEditWithData;
