import { useEffect } from 'react';

import { AuthorizationUtils } from '../../../../../app/authorization/lib';
import { useIsEnterprise } from '../../../../../client/hooks/useIsEnterprise';
import { guestPermissions } from '../../../../app/authorization/lib/guestPermissions';

export const useGuestPermissions = () => {
	const enabled = useIsEnterprise().data?.isEnterprise ?? false;

	useEffect(() => {
		if (!enabled) {
			return;
		}

		AuthorizationUtils.addRolePermissionWhiteList('guest', guestPermissions);
	}, [enabled]);
};
