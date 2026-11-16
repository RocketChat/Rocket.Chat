import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import ReadReceiptsModal from '../../../views/room/modals/ReadReceiptsModal';

export const useReadReceiptsDetailsAction = (
	message: IMessage,
	{ enabled, storeUsers }: { enabled: boolean; storeUsers: boolean },
): MessageActionConfig | null => {
	const setModal = useSetModal();

	if (!enabled || !storeUsers) {
		return null;
	}

	return {
		id: 'receipt-detail',
		icon: 'check-double',
		label: 'Read_Receipts',
		context: ['starred', 'message', 'message-mobile', 'threads', 'videoconf', 'videoconf-threads', 'federated'],
		type: 'duplication',
		action() {
			setModal(
				<ReadReceiptsModal
					messageId={message._id}
					rid={message.rid}
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
