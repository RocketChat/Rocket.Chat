import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import ReadReceiptsModal from '../../../views/room/modals/ReadReceiptsModal';
import { useMessageListReadReceipts } from '../list/MessageListContext';

export const useReadReceiptsDetailsAction = (message: IMessage): MessageActionConfig | null => {
	const setModal = useSetModal();

	const { enabled: readReceiptsEnabled, storeUsers: readReceiptsStoreUsers } = useMessageListReadReceipts();

	if (!readReceiptsEnabled || !readReceiptsStoreUsers) {
		return null;
	}

	return {
		id: 'receipt-detail',
		icon: 'check-double',
		label: 'Read_Receipts',
		context: ['starred', 'message', 'message-mobile', 'threads', 'videoconf', 'videoconf-threads'],
		type: 'duplication',
		action() {
			setModal(
				<ReadReceiptsModal
					messageId={message._id}
					onClose={() => {
						setModal(null);
					}}
				/>,
			);
		},
		order: 10,
		group: 'menu',
	};
};
