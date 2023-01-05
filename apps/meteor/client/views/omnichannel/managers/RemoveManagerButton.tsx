import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

const RemoveManagerButton = ({ _id, reload }: { _id: string; reload: () => void }): ReactElement => {
	const t = useTranslation();
	const deleteAction = useEndpointAction('DELETE', `/v1/livechat/users/manager/${_id}`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRemoveClick = useMutableCallback(async () => {
		await deleteAction();
		reload();
	});
	const handleDelete = useMutableCallback((e) => {
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
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton small icon='trash' title={t('Remove')} onClick={handleDelete} />
		</Table.Cell>
	);
};

export default RemoveManagerButton;
