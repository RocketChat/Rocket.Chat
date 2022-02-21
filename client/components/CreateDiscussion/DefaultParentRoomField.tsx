import { Skeleton, TextInput, Callout } from '@rocket.chat/fuselage';
import React, { useMemo, ReactElement } from 'react';

import type { IRoom } from '../../../definition/IRoom';
import { useTranslation } from '../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../hooks/useAsyncState';
import { useEndpointData } from '../../hooks/useEndpointData';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const DefaultParentRoomField = ({ defaultParentRoom }: { defaultParentRoom: string }): ReactElement => {
	const t = useTranslation();
	const { value, phase } = useEndpointData(
		'rooms.info',
		useMemo(
			() => ({
				roomId: defaultParentRoom,
			}),
			[defaultParentRoom],
		),
	);

	if (phase === AsyncStatePhase.LOADING) {
		return <Skeleton width='full' />;
	}

	if (!value || !value.room) {
		return <Callout type={'danger'}>{t('Error')}</Callout>;
	}

	return (
		<TextInput value={roomCoordinator.getRoomName(value.room.t, value.room as unknown as IRoom)} disabled onChange={(): string => ''} />
	);
};

export default DefaultParentRoomField;
