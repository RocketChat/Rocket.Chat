import type { IRoom } from '@rocket.chat/core-typings';

import ParentRoom from './ParentRoom';
import { HeaderTagSkeleton } from '../../../components/Header';
import { useRoomInfoEndpoint } from '../../../hooks/useRoomInfoEndpoint';

type ParentRoomWithEndpointDataProps = {
	rid: IRoom['_id'];
};

const ParentRoomWithEndpointData = ({ rid }: ParentRoomWithEndpointDataProps) => {
	const { data, isPending, isError } = useRoomInfoEndpoint(rid);

	if (isPending) {
		return <HeaderTagSkeleton />;
	}

	if (isError || !data?.room) {
		return null;
	}

	return <ParentRoom room={data.room} />;
};

export default ParentRoomWithEndpointData;
