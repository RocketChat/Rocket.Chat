import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Callout } from '@rocket.chat/fuselage';
import React, { useState, useMemo } from 'react';

import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo/EditRoomInfo.js';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import TeamsInfo from './TeamsInfo';
import VerticalBar from '../../../../components/VerticalBar';

export default function TeamsInfoWithRooms({ rid }) {
	const [editing, setEditing] = useState(false);
	const onClickBack = useMutableCallback(() => setEditing(false));
	const t = useTranslation();

	const params = useMemo(() => ({ roomId: rid }), [rid]);
	const { phase, value, error } = useEndpointData('rooms.info', params);

	if (phase === AsyncStatePhase.LOADING) {
		return <VerticalBar.Skeleton />;
	}

	if (error) {
		return <VerticalBar>
			<VerticalBar.Header>
				<VerticalBar.Icon name='info-circled'/>
				<VerticalBar.Text>{t('Team_Info')}</VerticalBar.Text>
				<VerticalBar.Close />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Callout type='danger'>
					{JSON.stringify(error)}
				</Callout>
			</VerticalBar.ScrollableContent>
		</VerticalBar>;
	}

	return editing ? <EditChannelWithData onClickBack={onClickBack} rid={rid} /> : <TeamsInfo openEditing={setEditing} room={value.room} />;
}
