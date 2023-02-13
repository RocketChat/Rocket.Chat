import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { useInstance } from './useInstance';
import { useUserCard } from './useUserCard';

export function useChatMessagesInstance({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): ChatAPI {
	const chatMessages = useInstance(() => {
		const instance = new ChatMessages({ rid, tmid });

		return [instance, () => instance.release()];
	}, [rid, tmid]);

	chatMessages.userCard = useUserCard();

	return chatMessages;
}
