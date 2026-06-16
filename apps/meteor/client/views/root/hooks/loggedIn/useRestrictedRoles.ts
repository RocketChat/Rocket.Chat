import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { AuthorizationUtils } from '../../../../../app/authorization/lib';

export const useRestrictedRoles = (): void => {
	const getLicenseInfo = useEndpoint('GET', '/v1/licenses.info');

	const { data: isEnterprise, isSuccess } = useQuery({
		queryKey: ['isEnterprise'],
		queryFn: async () => (await getLicenseInfo({})).license.hasValidLicense,
	});

	useEffect(() => {
		if (!isSuccess) {
			return;
		}

		if (isEnterprise) {
			AuthorizationUtils.addRolePermissionWhiteList('guest', [
				'view-d-room',
				'view-joined-room',
				'view-p-room',
				'start-discussion',
				'mobile-upload-file',
			]);
		}
	}, [isEnterprise, isSuccess]);
};
