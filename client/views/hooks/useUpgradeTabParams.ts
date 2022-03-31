import { format } from 'date-fns';
import { useCallback } from 'react';
import { useQuery } from 'react-query';

import { UpgradeTabVariant, getUpgradeTabType } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';

export const useUpgradeTabParams = (): { tabType: UpgradeTabVariant | false; trialEndDate: string | undefined; isLoading: boolean } => {
	const getRegistrationStatus = useEndpoint('GET', 'cloud.registrationStatus');
	const getLicenses = useEndpoint('GET', 'licenses.get');
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const { data: registrationStatusData } = useQuery(
		'getRegistrationStatus',
		useCallback(async () => getRegistrationStatus(), [getRegistrationStatus]),
	);

	const { data: getLicensesData, isLoading } = useQuery(
		'getLicences',
		useCallback(async () => getLicenses(), [getLicenses]),
	);

	console.log(getLicensesData);

	// const validLicenses = getLicensesQuery.data.licenses?.filter(({ valid }) => valid).map(({ license }) => license);

	// find any license that has trial
	const trialLicense = getLicensesData?.licenses.find(({ meta }) => meta?.trial);

	// if at least one license isn't trial, workspace isn't considered in trial
	const isTrial = !getLicensesData?.licenses.map(({ meta }) => meta?.trial).includes(false);
	const hasGoldLicense = getLicensesData?.licenses.map(({ tag }) => tag?.name === 'Gold').includes(true);
	const trialEndDate = trialLicense ? format(new Date(trialLicense?.meta?.trialEnd), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered: registrationStatusData?.registrationStatus.workspaceRegistered || false,
		hasValidLicense: getLicensesData?.licenses.length > 0,
		hadExpiredTrials: cloudWorkspaceHadTrial,
		isTrial,
		hasGoldLicense,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading };
};
