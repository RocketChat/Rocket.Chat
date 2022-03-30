import { useCallback } from 'react';
import { useQuery, UseQueryResult } from 'react-query';

import { UpgradeTabVariants } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';

const placeholderData = {
	tabType: false as false,
	trialEndDate: undefined,
};

export const useUpgradeTabParams = (): UseQueryResult<{ tabType: UpgradeTabVariants | false; trialEndDate: string | undefined }, Error> => {
	const getUpgradeTabParams = useEndpoint('GET', 'cloud.getUpgradeTabParams');

	return useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabParams(), [getUpgradeTabParams]),
		{ placeholderData },
	);
};
