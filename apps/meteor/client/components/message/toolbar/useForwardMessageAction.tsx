import { type IMessage, isE2EEMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { getPermaLink } from '../../../lib/getPermaLink';
import ForwardMessageModal from '../../../views/room/modals/ForwardMessageModal';

export const useForwardMessageAction = (message: IMessage) => {
	const encrypted = isE2EEMessage(message);
	const setModal = useSetModal();

	useEffect(() => {
		MessageAction.addButton({
			id: 'forward-message',
			icon: 'arrow-forward',
			label: 'Forward_message',
			context: ['message', 'message-mobile', 'threads'],
			type: 'communication',
			async action() {
				const permalink = await getPermaLink(message._id);
				setModal(
					<ForwardMessageModal
						message={message}
						permalink={permalink}
						onClose={() => {
							setModal(null);
						}}
					/>,
				);
			},
			order: 0,
			group: 'message',
			disabled: () => encrypted,
		});

		return () => {
			MessageAction.removeButton('forward-message');
		};
	}, [encrypted, message, setModal]);
};
