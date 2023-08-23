import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';

function RemoveAgentButton({ agentId, onRemove }: { agentId: string; onRemove: (agentId: string) => void }) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();

		const onRemoveAgent = async () => {
			onRemove(agentId);
			dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onRemoveAgent} onCancel={() => setModal()} confirmText={t('Delete')} />);
	});

	return <IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />;
}

export default RemoveAgentButton;
