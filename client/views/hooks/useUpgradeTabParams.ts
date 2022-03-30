import { useCallback } from 'react';
import { useQuery, UseQueryResult } from 'react-query';

import { UpgradeTabVariant } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';

export const useUpgradeTabParams = (): UseQueryResult<{ tabType: UpgradeTabVariant | false; trialEndDate: string | undefined }, Error> => {
	const getUpgradeTabParams = useEndpoint('GET', 'cloud.getUpgradeTabParams');

	return useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabParams(), [getUpgradeTabParams]),
	);
};
