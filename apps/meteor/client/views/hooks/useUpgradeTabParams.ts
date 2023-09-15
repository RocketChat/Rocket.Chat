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
	const hasValidLicense = licensesData?.licenses.some((license) => license.modules.length > 0) ?? false;
	const hadExpiredTrials = cloudWorkspaceHadTrial ?? false;

	// #TODO: Update to use license v3 format, load meta info from license.information
	const licenseMeta = licensesData?.licenses?.map((license: any) => (license.meta ?? license.cloudMeta) as Record<string, any>);

	const trialLicense = licenseMeta?.find((meta) => meta?.trial);
	const isTrial = licenseMeta?.every((meta) => meta?.trial) ?? false;
	const trialEndDate = trialLicense ? format(new Date(trialLicense.trialEnd), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered,
		hasValidLicense,
		hadExpiredTrials,
		isTrial,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading: !isSuccessLicense && !isSuccessRegistrationStatus };
};
