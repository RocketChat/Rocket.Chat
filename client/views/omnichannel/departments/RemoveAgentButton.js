import { Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';

function RemoveAgentButton({ agentId, setAgentList, agentList }) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async () => {
			const newList = agentList.filter((listItem) => listItem.agentId !== agentId);
			setAgentList(newList);
			dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
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
		<Button small ghost title={t('Remove')} onClick={handleDelete}>
			<Icon name='trash' size='x16' />
		</Button>
	);
}

export default RemoveAgentButton;
