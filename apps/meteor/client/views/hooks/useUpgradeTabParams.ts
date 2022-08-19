import { useSetting } from '@rocket.chat/ui-contexts';
import { format } from 'date-fns';

import { UpgradeTabVariant, getUpgradeTabType } from '../../../lib/getUpgradeTabType';
import { useLicense } from '../../hooks/useLicense';

export const useUpgradeTabParams = (): { tabType: UpgradeTabVariant | false; trialEndDate: string | undefined; isLoading: boolean } => {
	const cloudWorkspaceHadTrial = useSetting('Cloud_Workspace_Had_Trial') as boolean;

	const { licenses, isSuccess, registrationStatus } = useLicense();

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
