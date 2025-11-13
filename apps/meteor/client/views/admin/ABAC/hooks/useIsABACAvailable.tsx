import { useSetting } from '@rocket.chat/ui-contexts';

import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';

const useIsABACAvailable = () => {
	const hasABAC = useHasLicenseModule('abac') === true;
	const isABACSettingEnabled = useSetting('ABAC_Enabled', false);
	return hasABAC && isABACSettingEnabled;
};

export default useIsABACAvailable;
