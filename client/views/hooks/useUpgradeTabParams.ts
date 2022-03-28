import { useCallback } from 'react';
import { useQuery, UseQueryResult } from 'react-query';

import { UpgradeTabVariants } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';

const placeholderData = {
	tabType: false as false,
	trialEndDate: undefined,
};

export const useUpgradeTabParams = (): UseQueryResult<
	{ tabType: UpgradeTabVariants | false; trialEndDate: string | undefined },
	unknown
> => {
	const getUpgradeTabParams = useEndpoint('GET', 'cloud.getUpgradeTabParams');

	const result = useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabParams(), [getUpgradeTabParams]),
		{ placeholderData },
	);

	return result;
};
