import { Badge, Skeleton } from '@rocket.chat/fuselage';

import { useAppRequestStats } from '../hooks/useAppRequestStats';

const MarketplaceRequestBadge = () => {
	const requestStatsResult = useAppRequestStats();

	if (requestStatsResult.isPending)
		return requestStatsResult.fetchStatus !== 'idle' ? <Skeleton variant='circle' height='x16' width='x16' /> : null;

	if (requestStatsResult.isError) return null;

	if (!requestStatsResult.data.totalUnseen) {
		return null;
	}

	return <Badge variant='primary'>{requestStatsResult.data.totalUnseen}</Badge>;
};

export default MarketplaceRequestBadge;
