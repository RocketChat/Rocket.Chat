import { useMethod } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { AuthorizationUtils } from '../../../../app/authorization/lib';

export const useRestrictedRoles = (): void => {
	const isEnterprise = useMethod('license:isEnterprise');

	useEffect(() => {
		const setupRestrictedRoles = async (): Promise<void> => {
			const result = await isEnterprise();

			if (result) {
				AuthorizationUtils.addRolePermissionWhiteList('guest', [
					'view-d-room',
					'view-joined-room',
					'view-p-room',
					'start-discussion',
					'mobile-upload-file',
				]);
			}
		};

		setupRestrictedRoles();
	}, [isEnterprise]);
};
