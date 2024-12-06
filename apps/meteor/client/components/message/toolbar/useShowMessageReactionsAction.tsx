import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import ReactionListModal from '../../../views/room/modals/ReactionListModal';

export const useShowMessageReactionsAction = (message: IMessage) => {
	const setModal = useSetModal();

	useEffect(() => {
		if (!message.reactions) {
			return;
		}

		MessageAction.addButton({
			id: 'reaction-list',
			icon: 'emoji',
			label: 'Reactions',
			context: ['message', 'message-mobile', 'threads', 'videoconf', 'videoconf-threads'],
			type: 'interaction',
			action() {
				setModal(
					<ReactionListModal
						reactions={message.reactions ?? {}}
						onClose={() => {
							setModal(null);
						}}
					/>,
				);
			},
			order: 9,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('reaction-list');
		};
	}, [message.reactions, setModal]);
};
