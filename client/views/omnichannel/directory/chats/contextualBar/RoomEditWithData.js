import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { FormSkeleton } from '../../Skeleton';
import VisitorData from './VisitorData';
import { useRoomEditData } from './hooks/useRoomEditData';

function RoomEditWithData({ id, reload, reloadInfo, close }) {
	const t = useTranslation();

	const { value: data, phase: state, error } = useRoomEditData(id);

	if ([state].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (error || !data || !data.room) {
		return <Box mbs='x16'>{t('Room_not_found')}</Box>;
	}

	return (
		<VisitorData
			room={data}
			reload={reload}
			reloadInfo={reloadInfo}
			close={close}
			tags={data.tags}
		/>
	);
}

export default RoomEditWithData;
