import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { GenericTableCell } from '../../../components/GenericTable';
import { useRemoveCurrentChatMutation } from './hooks/useRemoveCurrentChatMutation';

type RemoveChatButtonProps = { _id: string };

const RemoveChatButton = ({ _id }: RemoveChatButtonProps) => {
	const removeCurrentChatMutation = useRemoveCurrentChatMutation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		removeCurrentChatMutation.mutate(_id);
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(
			<GenericModal
				variant='danger'
				data-qa-id='current-chats-modal-remove'
				onConfirm={onDeleteAgent}
				onClose={handleClose}
				onCancel={handleClose}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<GenericTableCell maxHeight='x36' fontScale='p2' color='hint' withTruncatedText data-qa='current-chats-cell-delete'>
			<IconButton small icon='trash' title={t('Remove')} disabled={removeCurrentChatMutation.isLoading} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveChatButton;
