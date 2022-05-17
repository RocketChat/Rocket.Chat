import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from '../../../../../components/GenericModal';

const RemoveAgentButton: FC<{ username: string; reload: () => void }> = ({ username, reload }) => {
	const removeAgent = useEndpoint('DELETE', 'omnichannel/agent/extension');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeAgent({ username });
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
		}
		reload();
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			} catch (error: any) {
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
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Button small ghost title={t('Remove_Association')} onClick={handleDelete}>
				<Icon name='trash' size='x16' />
			</Button>
		</Table.Cell>
	);
};

export default RemoveAgentButton;
