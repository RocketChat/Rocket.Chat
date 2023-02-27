import type { IUser } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import { getUserDisplayName } from '../lib/getUserDisplayName';

export const useUserDisplayName = ({ name, username }: Pick<IUser, 'name' | 'username'>): string | undefined => {
	const useRealName = useUserPreference('messagesLayout') !== 'username';

	return getUserDisplayName(name, username, !!useRealName);
};
