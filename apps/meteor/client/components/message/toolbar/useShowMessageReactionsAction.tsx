import type { IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import ReactionListModal from '../../../views/room/modals/ReactionListModal';

export const useShowMessageReactionsAction = ({ reactions = {} }: IMessage) => {
	const setModal = useSetModal();

	useEffect(() => {
		if (!reactions) {
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
						reactions={reactions}
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
	}, [reactions, setModal]);
};
