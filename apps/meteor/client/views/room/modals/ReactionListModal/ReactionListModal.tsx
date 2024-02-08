import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import Reactions from './Reactions';

type ReactionListModalProps = {
	reactions: Required<IMessage>['reactions'];
	onOpenUserCard?: (e: UIEvent, username: string) => void;
	onClose: () => void;
};

const ReactionListModal = ({ reactions, onOpenUserCard, onClose }: ReactionListModalProps): ReactElement => {
	const t = useTranslation();

	return (
		<GenericModal variant='info' title={t('Users_reacted')} onClose={onClose} onConfirm={onClose} confirmText={t('Close')}>
			<Reactions reactions={reactions} onOpenUserCard={onOpenUserCard} />
		</GenericModal>
	);
};

export default ReactionListModal;
