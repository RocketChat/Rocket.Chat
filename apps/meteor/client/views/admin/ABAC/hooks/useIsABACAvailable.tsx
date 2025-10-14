import { useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

const useIsABACAvailable = () => {
	const hasABAC = useHasLicenseModule('abac');
	const isABACSettingEnabled = useSetting('ABAC_Enabled');
	return Boolean(hasABAC && isABACSettingEnabled);
};

export default useIsABACAvailable;
