import { useModal, useSetting } from '@rocket.chat/ui-contexts';
import React, { Suspense, lazy, useEffect } from 'react';

import { ui } from '../../../../../client/lib/ui';
import { messageArgs } from '../../../../../client/lib/utils/messageArgs';

const ReadReceiptsModal = lazy(() => import('../../room/modals/ReadReceiptsModal/ReadReceiptsModal'));

export const useReadReceipts = () => {
	const enabled = useSetting('Message_Read_Receipt_Store_Users');

	const { setModal } = useModal();

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return ui.addMessageAction({
			id: 'receipt-detail',
			icon: 'info-circled',
			label: 'Info',
			context: ['starred', 'message', 'message-mobile', 'threads'],
			action(_, props) {
				const { message = messageArgs(this).msg } = props;
				setModal(
					// TODO: Revisit Modal's FocusScope which currently does not accept null as children.
					// Added dummy div fallback for that reason.
					<Suspense fallback={<div />}>
						<ReadReceiptsModal messageId={message._id} onClose={() => setModal(null)} />
					</Suspense>,
				);
			},
			order: 10,
			group: 'menu',
		});
	}, [enabled, setModal]);
};
