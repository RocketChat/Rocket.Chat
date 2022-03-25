import { Table, Icon, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { FC, useEffect } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { useEndpoint, useStream } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserId } from '../../../../../contexts/UserContext';

const RemoveAgentButton: FC<{ username: string; reload: () => void; extension: string }> = ({ username, reload, extension }) => {
	const removeAgent = useEndpoint('DELETE', 'omnichannel/agent/extension');
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const subscribeToNotifyUser = useStream('notify-user');
	const userId = useUserId();

	const handleRemoveClick = useMutableCallback(async () => {
		try {
			await removeAgent({ username });
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	useEffect(() => {
		if (!userId) {
			return;
		}
		const handleExtensionStateChange = (state: { userId: string; extension: string; state: string }): void => {
			if (extension === state.extension) {
				reload();
			}
		};
		return subscribeToNotifyUser(`${userId}/voipextensionstatechange`, handleExtensionStateChange);
	}, [subscribeToNotifyUser, userId, extension, reload]);

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
