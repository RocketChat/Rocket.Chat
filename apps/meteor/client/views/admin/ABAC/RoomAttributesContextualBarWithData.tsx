import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import RoomAttributesContextualBar from './RoomAttributesContextualBar';
import { ABACQueryKeys } from '../../../lib/queryKeys';

type RoomAttributesContextualBarWithDataProps = {
	id: string;
	onClose: () => void;
};

const RoomAttributesContextualBarWithData = ({ id, onClose }: RoomAttributesContextualBarWithDataProps) => {
	const getAttributes = useEndpoint('GET', '/v1/abac/attributes/:_id', { _id: id });
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ABACQueryKeys.roomAttributes.attribute(id),
		queryFn: () => getAttributes(),
		staleTime: 0,
	});

	if (isLoading || isFetching) {
		return <ContextualbarSkeletonBody />;
	}

	return <RoomAttributesContextualBar attributeData={data} onClose={onClose} />;
};

export default RoomAttributesContextualBarWithData;
