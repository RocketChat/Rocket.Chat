import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { useHasLicenseModule } from '../../../../ee/client/hooks/useHasLicenseModule';

export const useMultipleDepartmentsAvailable = (): boolean | string => {
	const getDepartments = useEndpoint('GET', '/v1/livechat/department');
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	const { data } = useQuery(['getDepartments'], async () => getDepartments());
	return data?.total < 1 || hasLicense;
};
