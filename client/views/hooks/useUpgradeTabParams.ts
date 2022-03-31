import { format } from 'date-fns';
import { useQuery } from 'react-query';

import { UpgradeTabVariant, getUpgradeTabType } from '../../../lib/getUpgradeTabType';
import { useEndpoint } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';

export const useUpgradeTabParams = (): { tabType: UpgradeTabVariant | false; trialEndDate: string | undefined; isLoading: boolean } => {
	const getRegistrationStatus = useEndpoint('GET', 'cloud.registrationStatus');
	const getLicenses = useEndpoint('GET', 'licenses.get');
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const { data: registrationStatusData } = useQuery(['registrationStatus'], () => getRegistrationStatus());
	const { data: getLicensesData, isLoading } = useQuery(['licences'], () => getLicenses(), {
		enabled: !!registrationStatusData,
	});

	const { registrationStatus } = registrationStatusData ?? {};
	const { licenses } = getLicensesData ?? {};

	const registered = registrationStatus?.workspaceRegistered ?? false;
	const hasValidLicense = (licenses?.length ?? 0) > 0;
	const hadExpiredTrials = cloudWorkspaceHadTrial ?? false;
	const isTrial = licenses?.every(({ meta }) => meta.trial) ?? false;
	const hasGoldLicense = licenses?.some(({ tag }) => tag?.name === 'Gold') ?? false;

	const longestTrialLicense = isTrial
		? licenses?.filter(({ meta }) => meta?.trial).sort((a, b) => Date.parse(b.meta.trialEnd) - Date.parse(a.meta.trialEnd))[0]
		: undefined;
	const trialEndDate = longestTrialLicense ? format(new Date(longestTrialLicense.meta.trialEnd), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered,
		hasValidLicense,
		hadExpiredTrials,
		isTrial,
		hasGoldLicense,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading };
};
