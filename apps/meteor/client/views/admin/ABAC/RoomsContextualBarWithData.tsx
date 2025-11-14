import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import RoomsContextualBar from './RoomsContextualBar';
import { ContextualbarSkeletonBody } from '../../../components/Contextualbar';
import { ABACQueryKeys } from '../../../lib/queryKeys';

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

	const attributesData = data?.abacAttributes;

	if (isLoading || isFetching) {
		return <ContextualbarSkeletonBody />;
	}

	return (
		<RoomsContextualBar roomInfo={{ rid: id, name: data?.fname || data?.name || id }} attributesData={attributesData} onClose={onClose} />
	);
};

export default RoomsContextualBarWithData;
