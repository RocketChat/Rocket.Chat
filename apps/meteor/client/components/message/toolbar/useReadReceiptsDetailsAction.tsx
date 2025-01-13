import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import ReadReceiptsModal from '../../../views/room/modals/ReadReceiptsModal';

export const useReadReceiptsDetailsAction = (message: IMessage): MessageActionConfig | null => {
	const setModal = useSetModal();

	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Enabled', false);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);

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
