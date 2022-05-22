import type { IUser } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

import { getUserDisplayName } from '../lib/getUserDisplayName';

export const useUserDisplayName = ({ name, username }: Pick<IUser, 'name' | 'username'>): string | undefined => {
	const useRealName = useSetting('UI_Use_Real_Name');

	return getUserDisplayName(name, username, !!useRealName);
};
