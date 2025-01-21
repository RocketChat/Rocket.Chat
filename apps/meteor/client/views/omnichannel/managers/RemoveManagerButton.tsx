import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import { GenericTableCell } from '../../../components/GenericTable';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

const RemoveManagerButton = ({ _id, reload }: { _id: string; reload: () => void }): ReactElement => {
	const { t } = useTranslation();
	const deleteAction = useEndpointAction('DELETE', '/v1/livechat/users/manager/:_id', { keys: { _id } });
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRemoveClick = useEffectEvent(async () => {
		await deleteAction();
		reload();
	});
	const handleDelete = useEffectEvent((e: MouseEvent) => {
		e.stopPropagation();
		const onDeleteManager = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Manager_removed') });
			} catch (error: unknown) {
				(typeof error === 'string' || error instanceof Error) && dispatchToastMessage({ type: 'error', message: error });
			}
			setModal();
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteManager}
				onCancel={(): void => setModal()}
				onClose={(): void => setModal()}
				confirmText={t('Delete')}
			/>,
		);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton small icon='trash' title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveManagerButton;
