import type { IMessage } from '@rocket.chat/core-typings';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { MessageAuthor } from '../../../../components/message/list/messageListContract';

/** The author a message is shown as written by, following name and username changes made after it was sent */
export const useMessageAuthor = (message: IMessage): MessageAuthor => {
	const presence = useUserPresence(message.u._id);

	return useMemo(
		() => ({
			...message.u,
			...(presence?.username && { username: presence.username }),
			...(presence?.name && { name: presence.name }),
		}),
		[message.u, presence?.username, presence?.name],
	);
};
