import type { IUser } from '@rocket.chat/core-typings';

import { useUserInfoQuery } from '../../../../hooks/useUserInfoQuery';

export const useIsUserDeleted = (userId: IUser['_id']) => {
	const { data } = useUserInfoQuery({ userId });
	return !data;
};
