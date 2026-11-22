import type { IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';

import { e2e } from '../../lib/e2ee';
import { scheduledMessagesQueryKeys } from '../../lib/queryKeys';
import { useE2EERoomState } from '../../views/room/hooks/useE2EERoomState';

export const useScheduledMessageText = ({ rid, msg, t, content }: Pick<Serialized<IScheduledMessage>, 'rid' | 'msg' | 't' | 'content'>) => {
	const encrypted = t === 'e2e' && !!content;
	const ready = useE2EERoomState(rid) === 'READY';
	const { data } = useQuery({
		queryKey: scheduledMessagesQueryKeys.text(content?.ciphertext),
		queryFn: async () => (content && (await (await e2e.getInstanceByRoomId(rid))?.decrypt(content))?.msg) ?? '',
		enabled: encrypted && ready,
		staleTime: Infinity,
	});
	return encrypted ? data : msg;
};
