import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../components/GenericModal';

function RemoveAgentButton({ agentId, onRemove }: { agentId: string; onRemove: (agentId: string) => void }) {
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const handleDelete = useEffectEvent((e: MouseEvent) => {
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
