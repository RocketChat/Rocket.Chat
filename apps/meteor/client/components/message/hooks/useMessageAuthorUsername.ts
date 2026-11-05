import type { IMessage } from '@rocket.chat/core-typings';

import { normalizeUsername } from '../../../../lib/utils/normalizeUsername';
import { useMessageListShowRealName, useMessageListShowUsername } from '../list/MessageListContext';

export const useMessageAuthorUsername = ({ name, username }: Pick<IMessage['u'], 'name' | 'username'>) => {
	const showRealName = useMessageListShowRealName();
	const messageListShowUsername = useMessageListShowUsername();

	const normalizedUsername = normalizeUsername(username);
	const nameRepeatsUsername = !name || normalizeUsername(name) === normalizedUsername;

	return {
		normalizedUsername,
		showUsername: messageListShowUsername && showRealName && !nameRepeatsUsername,
	};
};
