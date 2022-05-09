import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import GenericModal from '../../../components/GenericModal';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

const RemoveManagerButton = ({ _id, reload }: { _id: string; reload: () => void }): ReactElement => {
	const t = useTranslation();
	const deleteAction = useEndpointAction('DELETE', `livechat/users/manager/${_id}`);
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const handleRemoveClick = useMutableCallback(async () => {
		const result = await deleteAction();
		if (result?.success === true) {
			reload();
		}
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
			<Button small ghost title={t('Remove')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
};

export default RemoveManagerButton;
