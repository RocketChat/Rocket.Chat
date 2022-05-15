import { Skeleton, TextInput, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, ReactElement } from 'react';

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
		<TextInput
			defaultValue={roomCoordinator.getRoomName(value.room.t, {
				_id: value.room._id,
				fname: value.room.fname,
				name: value.room.name,
				prid: value.room.prid,
			})}
			disabled
		/>
	);
};

export default DefaultParentRoomField;
