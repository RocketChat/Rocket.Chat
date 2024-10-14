import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useRemoveCurrentChatMutation } from './hooks/useRemoveCurrentChatMutation';

type RemoveChatButtonProps = { _id: string };

const RemoveChatButton = ({ _id }: RemoveChatButtonProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const removeCurrentChatMutation = useRemoveCurrentChatMutation();

	const handleRemoveClick = useEffectEvent(async () => {
		removeCurrentChatMutation.mutate(_id);
	});

	const handleDelete = useEffectEvent((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		setModal(
			<GenericModal
				variant='danger'
				data-qa-id='current-chats-modal-remove'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal(null)}
				confirmText={t('Delete')}
			/>,
		);
	});

	return <IconButton danger small icon='trash' title={t('Remove')} disabled={removeCurrentChatMutation.isLoading} onClick={handleDelete} />;
};

export default RemoveChatButton;
