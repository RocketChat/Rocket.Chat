import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import RoomEdit from './RoomEdit';

function VisitorData({ room, reload, reloadInfo, close }) {
	const t = useTranslation();

	const {
		room: {
			v: { _id },
		},
	} = room;

	const { value: visitor, phase: stateVisitor, error: errorVisitor } = useEndpointData(`livechat/visitors.info?visitorId=${_id}`);

	if ([stateVisitor].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (errorVisitor || !visitor || !visitor.visitor) {
		return <Box mbs='x16'>{t('Visitor_not_found')}</Box>;
	}

	const { visitor: visitorData } = visitor;
	const { room: roomData } = room;

	return <RoomEdit room={roomData} visitor={visitorData} reload={reload} reloadInfo={reloadInfo} close={close} />;
}

export default VisitorData;
