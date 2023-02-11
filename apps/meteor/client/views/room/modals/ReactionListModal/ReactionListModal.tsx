import type { IMessage } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useChat } from '../../contexts/ChatContext';
import Reactions from './Reactions';

type ReactionListProps = {
	reactions: Required<IMessage>['reactions'];
	onClose: () => void;
};

const ReactionList = ({ reactions, onClose }: ReactionListProps): ReactElement => {
	const t = useTranslation();

	const chat = useChat();

	const onClick = useMutableCallback((e) => {
		const { username } = e.currentTarget.dataset;

		if (!username) {
			return;
		}

		chat?.userCard.open(username)(e);
	});

	return (
		<GenericModal variant='info' title={t('Users_reacted')} onClose={onClose} onConfirm={onClose}>
			<Reactions reactions={reactions} onClick={onClick} />
		</GenericModal>
	);
};

export default ReactionList;
