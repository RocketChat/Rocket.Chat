import { Skeleton, TextInput, Callout } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

const DefaultParentRoomField = ({ defaultParentRoom }: { defaultParentRoom: string }): ReactElement => {
	const t = useTranslation();

	const query = useMemo(
		() => ({
			roomId: defaultParentRoom,
		}),
		[defaultParentRoom],
	);

	const roomsInfoEndpoint = useEndpoint('GET', '/v1/rooms.info');

	const { data, isPending, isError } = useQuery({
		queryKey: ['defaultParentRoomInfo', query],
		queryFn: async () => roomsInfoEndpoint(query),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <Skeleton width='full' />;
	}

	if (!data?.room || isError) {
		return <Callout type='danger'>{t('Error')}</Callout>;
	}

	return (
		<TextInput
			defaultValue={roomCoordinator.getRoomName(data.room.t, {
				_id: data.room._id,
				fname: data.room.fname,
				name: data.room.name,
				prid: data.room.prid,
			})}
			disabled
		/>
	);
};

export default DefaultParentRoomField;
