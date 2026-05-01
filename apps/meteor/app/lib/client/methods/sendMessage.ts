import type { IMessage } from '@rocket.chat/core-typings';
import { clientCallbacks } from '@rocket.chat/ui-client';

import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { settings } from '../../../../client/lib/settings';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import { getUser, getUserId } from '../../../../client/lib/user';
import { Messages, Rooms } from '../../../../client/stores';
import { trim } from '../../../../lib/utils/stringUtils';
import { t } from '../../../utils/lib/i18n';

export const runOptimisticSendMessage = async (
	message: Partial<IMessage> & { rid: IMessage['rid']; msg: IMessage['msg'] },
): Promise<void> => {
	const uid = getUserId();
	if (!uid || trim(message.msg) === '') {
		return;
	}
	const messageAlreadyExists = message._id && Messages.state.get(message._id);
	if (messageAlreadyExists) {
		dispatchToastMessage({ type: 'error', message: t('Message_Already_Sent') });
		return;
	}
	const user = getUser();
	if (!user?.username) {
		return;
	}

	const room = Rooms.state.get(message.rid);
	if (room?.federated) {
		return;
	}

	const optimistic: IMessage = {
		...(message as IMessage),
		ts: new Date(),
		u: {
			_id: uid,
			username: user.username,
			name: user.name || '',
		},
		temp: true,
		...(settings.peek('Message_Read_Receipt_Enabled') ? { unread: true } : {}),
	};

	const processed = await onClientMessageReceived(optimistic);
	Messages.state.store(processed);
	await clientCallbacks.run('afterSaveMessage', processed, { room, user });
};
