import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from '../../../components/GenericModal';
import { useRemoveCurrentChatMutation } from './hooks/useRemoveCurrentChatMutation';

const RemoveChatButton: FC<{ _id: string }> = ({ _id }) => {
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
			<GenericModal variant='danger' onConfirm={onDeleteAgent} onClose={handleClose} onCancel={handleClose} confirmText={t('Delete')} />,
		);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText data-qa='current-chats-cell-delete'>
			<IconButton small icon='trash' title={t('Remove')} disabled={removeCurrentChatMutation.isLoading} onClick={handleDelete} />
		</Table.Cell>
	);
};

export default RemoveChatButton;
