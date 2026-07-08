import type { IPermission } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { AuthorizationContext } from '../AuthorizationContext';

export const useGetPermission = (permission: string): IPermission | undefined => {
	const { getPermission } = useContext(AuthorizationContext);

	return getPermission(permission);
};
