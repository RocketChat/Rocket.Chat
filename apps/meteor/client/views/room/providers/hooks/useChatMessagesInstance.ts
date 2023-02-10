import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { useInstance } from './useInstance';

export function useChatMessagesInstance({ rid, tmid }: { rid: IRoom['_id']; tmid?: IMessage['_id'] }): ChatAPI {
	return useInstance(() => {
		const instance = new ChatMessages({ rid, tmid });

		return [instance, () => instance.release()];
	}, [rid, tmid]);
}
