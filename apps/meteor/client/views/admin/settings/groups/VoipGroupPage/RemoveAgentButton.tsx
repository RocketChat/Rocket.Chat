import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';
import { GenericTableCell } from '../../../../../components/GenericTable';

type RemoveAgentButtonProps = { username: string; reload: () => void };

const RemoveAgentButton = ({ username, reload }: RemoveAgentButtonProps) => {
	const removeAgent = useEndpoint('DELETE', '/v1/omnichannel/agent/extension/:username', { username });
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const handleRemoveClick = useEffectEvent(async () => {
		try {
			await removeAgent();
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		reload();
	});

	const handleDelete = useEffectEvent((e: MouseEvent) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			} catch (error: unknown) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteAgent}
				onCancel={(): void => setModal()}
				onClose={(): void => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove_Association')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveAgentButton;
