import { Table, IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import GenericModal from '../../../components/GenericModal';
import { useEndpointAction } from '../../../hooks/useEndpointAction';

type RemoveAgentButtonProps = {
	_id: string;
	reload: () => void;
};

const RemoveAgentButton: FC<RemoveAgentButtonProps> = ({ _id, reload }) => {
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
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Agent_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: String(error) });
			}
			setModal();
		};

		setModal(<GenericModal variant='danger' onConfirm={onDeleteAgent} onCancel={(): void => setModal()} confirmText={t('Delete')} />);
	});

	return (
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' mini small title={t('Remove')} onClick={handleDelete} />
		</Table.Cell>
	);
};

export default RemoveAgentButton;
