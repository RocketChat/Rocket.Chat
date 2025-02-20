import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useInstance } from './useInstance';
import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { useEmojiPicker } from '../../../../contexts/EmojiPickerContext';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useRoomSubscription } from '../../contexts/RoomContext';
import { useE2EERoomState } from '../../hooks/useE2EERoomState';

export function useChatMessagesInstance({
	rid,
	tmid,
	encrypted,
}: {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	encrypted: IRoom['encrypted'];
}): ChatAPI {
	const uid = useUserId();
	const subscription = useRoomSubscription();
	const actionManager = useUiKitActionManager();
	const e2eRoomState = useE2EERoomState(rid);

	const chatMessages = useInstance(() => {
		const instance = new ChatMessages({ rid, tmid, uid, actionManager });

		return [instance, () => instance.release()];
	}, [rid, tmid, uid, encrypted, e2eRoomState]);

	useEffect(() => {
		if (subscription) {
			chatMessages?.readStateManager.updateSubscription(subscription);
		}
	}, [subscription, chatMessages?.readStateManager]);

	chatMessages.emojiPicker = useEmojiPicker();

	return chatMessages;
}
