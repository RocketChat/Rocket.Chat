import { useSetting } from '@rocket.chat/ui-contexts';
import { format } from 'date-fns';

import type { UpgradeTabVariant } from '../../../lib/upgradeTab';
import { getUpgradeTabType } from '../../../lib/upgradeTab';
import { useLicense } from '../../hooks/useLicense';
import { useRegistrationStatus } from '../../hooks/useRegistrationStatus';

export const useUpgradeTabParams = (): { tabType: UpgradeTabVariant | false; trialEndDate: string | undefined; isLoading: boolean } => {
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const { data: licensesData, isSuccess: isSuccessLicense } = useLicense();
	const { data: registrationStatusData, isSuccess: isSuccessRegistrationStatus } = useRegistrationStatus();

	const registered = registrationStatusData?.registrationStatus?.workspaceRegistered ?? false;

	const license = licensesData?.data.license;
	const activeModules = licensesData?.data.activeModules || [];

	const hasValidLicense = activeModules.length > 0 || (license?.grantedModules?.length || 0) > 0;
	const hadExpiredTrials = cloudWorkspaceHadTrial ?? false;

	const trialLicense = license?.information?.trial || false;
	const isTrial = Boolean(trialLicense);
	const trialEndDateStr = license?.information?.visualExpiration || license?.cloudMeta?.trialEnd;
	const trialEndDate = trialEndDateStr ? format(new Date(trialEndDateStr), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered,
		hasValidLicense,
		hadExpiredTrials,
		isTrial,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading: !isSuccessLicense && !isSuccessRegistrationStatus };
};
