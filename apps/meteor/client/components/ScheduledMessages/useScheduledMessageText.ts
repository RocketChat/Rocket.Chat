import type { IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import { e2e } from '../../lib/e2ee';
import { scheduledMessagesQueryKeys } from '../../lib/queryKeys';

export const useScheduledMessageText = ({ rid, msg, t, content }: Pick<Serialized<IScheduledMessage>, 'rid' | 'msg' | 't' | 'content'>) => {
	const encrypted = t === 'e2e' && !!content;
	const { data } = useQuery({
		queryKey: [...scheduledMessagesQueryKeys.all, 'text', content?.ciphertext],
		queryFn: async () => (await (await e2e.getInstanceByRoomId(rid))?.decrypt(content!))?.msg ?? '',
		enabled: encrypted,
		staleTime: Infinity,
	});
	return encrypted ? data : msg;
};
