import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

function RemoveAgentButton({ _id, reload }) {
	const deleteAction = useEndpointAction('DELETE', `livechat/users/agent/${_id}`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		const result = await deleteAction();
		if (result.success === true) {
			reload();
		}
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<Table.Cell fontScale='p1' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
}

export default RemoveAgentButton;
