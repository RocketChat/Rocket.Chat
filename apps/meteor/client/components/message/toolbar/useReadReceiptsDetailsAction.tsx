import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import ReadReceiptsModal from '../../../views/room/modals/ReadReceiptsModal';

export const useReadReceiptsDetailsAction = (message: IMessage) => {
	const setModal = useSetModal();

	const readReceiptsEnabled = useSetting('Message_Read_Receipt_Enabled', false);
	const readReceiptsStoreUsers = useSetting('Message_Read_Receipt_Store_Users', false);

	useEffect(() => {
		if (!readReceiptsEnabled || !readReceiptsStoreUsers) {
			return;
		}

		MessageAction.addButton({
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
		});

		return () => {
			MessageAction.removeButton('receipt-detail');
		};
	}, [message._id, readReceiptsEnabled, readReceiptsStoreUsers, setModal]);
};
