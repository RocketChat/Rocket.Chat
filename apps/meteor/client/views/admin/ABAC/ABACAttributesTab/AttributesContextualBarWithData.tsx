import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import AttributesContextualBar from './AttributesContextualBar';
import { ABACQueryKeys } from '../../../../lib/queryKeys';

type AttributesContextualBarWithDataProps = {
	id: string;
	onClose: () => void;
};

const AttributesContextualBarWithData = ({ id, onClose }: AttributesContextualBarWithDataProps) => {
	const getAttributes = useEndpoint('GET', '/v1/abac/attributes/:_id', { _id: id });
	const { data, isLoading, isFetching } = useQuery({
		queryKey: ABACQueryKeys.roomAttributes.attribute(id),
		queryFn: () => getAttributes(),
		staleTime: 0,
	});

	if (isLoading || isFetching) {
		return <ContextualbarSkeletonBody />;
	}

	return <AttributesContextualBar attributeData={data} onClose={onClose} />;
};

export default AttributesContextualBarWithData;
