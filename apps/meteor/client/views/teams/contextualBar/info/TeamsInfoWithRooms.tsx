import type { IRoom } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo } from 'react';

import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarSkeleton,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../components/Contextualbar';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import EditChannelWithData from '../../../room/contextualBar/Info/EditRoomInfo';
import TeamsInfoWithData from './TeamsInfoWithData';

type TeamsInfoWithRoomsProps = {
	rid: IRoom['_id'];
};

const TeamsInfoWithRooms = ({ rid }: TeamsInfoWithRoomsProps) => {
	const [editing, setEditing] = useState(false);
	const onClickBack = useMutableCallback(() => setEditing(false));
	const t = useTranslation();

	const params = useMemo(() => ({ roomId: rid }), [rid]);
	const { phase, value, error } = useEndpointData('/v1/rooms.info', { params });

	if (phase === AsyncStatePhase.LOADING) {
		return <ContextualbarSkeleton />;
	}

	if (error) {
		return (
			<Contextualbar>
				<ContextualbarHeader>
					<ContextualbarIcon name='info-circled' />
					<ContextualbarTitle>{t('Team_Info')}</ContextualbarTitle>
					<ContextualbarClose />
				</ContextualbarHeader>
				<ContextualbarScrollableContent>
					<Callout type='danger'>{JSON.stringify(error)}</Callout>
				</ContextualbarScrollableContent>
			</Contextualbar>
		);
	}

	return editing ? (
		<EditChannelWithData onClickBack={onClickBack} rid={rid} />
	) : (
		<TeamsInfoWithData openEditing={setEditing} room={value.room} />
	);
};

export default TeamsInfoWithRooms;
