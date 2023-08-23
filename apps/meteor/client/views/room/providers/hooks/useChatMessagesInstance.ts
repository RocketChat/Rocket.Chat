import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { useEmojiPicker } from '../../../../contexts/EmojiPickerContext';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { useInstance } from './useInstance';
import { useUserCard } from './useUserCard';

export function useChatMessagesInstance({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): ChatAPI {
	const uid = useUserId();
	const chatMessages = useInstance(() => {
		const instance = new ChatMessages({ rid, tmid, uid });

		return [instance, () => instance.release()];
	}, [rid, tmid, uid]);

	chatMessages.userCard = useUserCard();
	chatMessages.emojiPicker = useEmojiPicker();

	return chatMessages;
}
