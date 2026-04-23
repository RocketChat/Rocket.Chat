import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import RoomsContextualBar from './RoomsContextualBar';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

type RoomsContextualBarWithDataProps = {
	id: string;
	onClose: () => void;
};

const RoomsContextualBarWithData = ({ id, onClose }: RoomsContextualBarWithDataProps) => {
	const getRoomAttributes = useEndpoint('GET', '/v1/rooms.adminRooms.getRoom');
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ABACQueryKeys.rooms.room(id),
		queryFn: () => getRoomAttributes({ rid: id }),
		staleTime: 0,
	});

	if (isLoading || isFetching) {
		return <ContextualbarSkeletonBody />;
	}

	return (
		<RoomsContextualBar
			roomInfo={{ rid: id, name: data?.fname || data?.name || id }}
			attributesData={data?.abacAttributes}
			onClose={onClose}
		/>
	);
};

export default RoomsContextualBarWithData;
