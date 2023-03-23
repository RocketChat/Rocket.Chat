import type { IUser } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import { isDisplayRealNamePreference } from '../../app/utils/lib/isDisplayRealNamePreference';
import { getUserDisplayName } from '../lib/getUserDisplayName';

export const useUserDisplayName = ({ name, username }: Pick<IUser, 'name' | 'username'>): string | undefined => {
	const useRealName = isDisplayRealNamePreference(useUserPreference('messagesLayout'));

	return getUserDisplayName(name, username, useRealName);
};
