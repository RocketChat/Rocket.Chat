import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from '../../../components/GenericModal';

const RemoveChatButton: FC<{ _id: string; reload: () => void }> = ({ _id, reload }) => {
	const removeChat = useMethod('livechat:removeRoom');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeChat(_id);
		} catch (error) {
			console.log(error);
		}
		reload();
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
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton small icon='trash' title={t('Remove')} onClick={handleDelete} />
		</Table.Cell>
	);
};

export default RemoveChatButton;
