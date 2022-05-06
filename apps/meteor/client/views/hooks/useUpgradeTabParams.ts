import { useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { format } from 'date-fns';
import { useQuery } from 'react-query';

import { UpgradeTabVariant, getUpgradeTabType } from '../../../lib/getUpgradeTabType';

export const useUpgradeTabParams = (): { tabType: UpgradeTabVariant | false; trialEndDate: string | undefined; isLoading: boolean } => {
	const getRegistrationStatus = useEndpoint('GET', 'cloud.registrationStatus');
	const getLicenses = useEndpoint('GET', 'licenses.get');
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const { data: registrationStatusData } = useQuery(['registrationStatus'], () => getRegistrationStatus());
	const { data: getValidLicensesData, isSuccess } = useQuery(['licences'], () => getLicenses(), {
		enabled: !!registrationStatusData,
	});

	const { registrationStatus } = registrationStatusData ?? {};
	const { licenses } = getValidLicensesData ?? {};

	const registered = registrationStatus?.workspaceRegistered ?? false;
	const hasValidLicense = (licenses?.length ?? 0) > 0;
	const hadExpiredTrials = cloudWorkspaceHadTrial ?? false;

	const trialLicense = licenses?.find(({ meta }) => meta?.trial);
	const isTrial = licenses?.every(({ meta }) => meta?.trial) ?? false;
	const hasGoldLicense = licenses?.some(({ tag }) => tag?.name === 'Gold') ?? false;
	const trialEndDate = trialLicense?.meta ? format(new Date(trialLicense.meta.trialEnd), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered,
		hasValidLicense,
		hadExpiredTrials,
		isTrial,
		hasGoldLicense,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading: !isSuccess };
};
