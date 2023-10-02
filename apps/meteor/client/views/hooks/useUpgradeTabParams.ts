import type { ILicenseV2, ILicenseV3 } from '@rocket.chat/license';
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

	const licenses = (licensesData?.licenses || []) as (Partial<ILicenseV2 & ILicenseV3> & { modules: string[] })[];

	const trialLicense = licenses.find(({ meta, information }) => information?.trial ?? meta?.trial);
	const isTrial = Boolean(trialLicense);
	const trialEndDateStr = trialLicense?.information?.visualExpiration || trialLicense?.meta?.trialEnd || trialLicense?.cloudMeta?.trialEnd;
	const trialEndDate = trialEndDateStr ? format(new Date(trialEndDateStr), 'yyyy-MM-dd') : undefined;

	const upgradeTabType = getUpgradeTabType({
		registered,
		hasValidLicense,
		hadExpiredTrials,
		isTrial,
	});

	return { tabType: upgradeTabType, trialEndDate, isLoading: !isSuccessLicense && !isSuccessRegistrationStatus };
};
