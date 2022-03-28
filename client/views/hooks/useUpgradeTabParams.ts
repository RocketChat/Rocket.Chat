import { useCallback } from 'react';
import { useQuery } from 'react-query';

import { UpgradeTabVariants } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';

export const useUpgradeTabParams = (): [data: UpgradeTabVariants | false, trialEndDate: string | undefined, isLoading: boolean] => {
	const getUpgradeTabParams = useEndpoint('GET', 'cloud.getUpgradeTabParams');

	const { data, isLoading } = useQuery(
		'upgradeTabType',
		useCallback(async () => getUpgradeTabParams(), [getUpgradeTabParams]),
	);

	return [data?.tabType || false, data?.trialEndDate, isLoading];
};
