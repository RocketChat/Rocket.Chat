import type { IMessage } from '@rocket.chat/core-typings';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { useMessageActions, useMessageListReadReceipts } from '../list/MessageListContext';

export const useReadReceiptsDetailsAction = (message: IMessage): MessageActionConfig | null => {
	const actions = useMessageActions();

	const { enabled: readReceiptsEnabled, storeUsers: readReceiptsStoreUsers } = useMessageListReadReceipts();

	if (!readReceiptsEnabled || !readReceiptsStoreUsers) {
		return null;
	}

	return {
		id: 'receipt-detail',
		icon: 'check-double',
		label: 'Read_Receipts',
		context: ['starred', 'message', 'message-mobile', 'threads', 'videoconf', 'videoconf-threads', 'federated'],
		type: 'duplication',
		action() {
			actions.showReadReceipts(message);
		},
		order: 10,
		group: 'menu',
	};
};
