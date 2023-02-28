import type { IUser } from '@rocket.chat/core-typings';
import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';

import { getUserDisplayName } from '../lib/getUserDisplayName';

export const useUserDisplayName = ({ name, username }: Pick<IUser, 'name' | 'username'>): string | undefined => {
	const messagesLayoutPreference = useUserPreference('messagesLayout');
	const defaultMessagesLayout = useSetting('Accounts_Default_User_Preferences_messagesLayout');
	const useRealName =
		messagesLayoutPreference !== 'default' ? messagesLayoutPreference !== 'username' : defaultMessagesLayout !== 'username';

	return getUserDisplayName(name, username, useRealName);
};
