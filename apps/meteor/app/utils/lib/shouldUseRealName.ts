import type { IUser } from '@rocket.chat/core-typings';

import { isDisplayRealNamePreference } from './isDisplayRealNamePreference';

export const shouldUseRealName = (defaultMessagesLayout: string, user?: Pick<IUser, 'settings'> | null) => {
	const messagesLayoutPreference = user?.settings?.preferences?.messagesLayout;
	if (!messagesLayoutPreference || messagesLayoutPreference === 'default') {
		return isDisplayRealNamePreference(defaultMessagesLayout);
	}

	return isDisplayRealNamePreference(messagesLayoutPreference);
};
