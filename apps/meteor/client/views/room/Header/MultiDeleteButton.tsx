import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../components/GenericModal';
import { HeaderToolbarAction } from '../../../components/Header';
import { useCountSelected, useClearSelection } from '../MessageList/contexts/SelectedMessagesContext';
import { selectedMessageStore } from '../providers/SelectedMessagesProvider';

const MultiDeleteButton = ({ roomId }: { roomId: string }) => {
	const countSelected = useCountSelected();
	const clearSelection = useClearSelection();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const deleteMessageEndpoint = useEndpoint('POST', '/v1/chat.delete');

	const [isDeleting, setIsDeleting] = useState(false);

	const multiDeleteMutation = useMutation({
		mutationFn: (messageIds: string[]) => {
			return Promise.all(messageIds.map((mid) => deleteMessageEndpoint({ msgId: mid, roomId, asUser: true })));
		},
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Messages_deleted') });
		},
		onError: () => {
			dispatchToastMessage({ type: 'error', message: t('Error_deleting_messages') });
		},
		onSettled: () => {
			clearSelection();
			setIsDeleting(false);
			setModal();
		},
	});

	const handleMultiDelete = () => {
		setModal(
			<GenericModal
				confirmText={t('Yes_delete_it')}
				title={t('Are_you_sure')}
				variant='danger'
				onConfirm={async () => {
					const messageIds = selectedMessageStore.getSelectedMessages();
					setIsDeleting(true);
					await multiDeleteMutation.mutateAsync(messageIds);
				}}
				onCancel={() => setModal()}
			>
				{t('Are_you_sure_you_want_to_delete_all_selected_messages')}
			</GenericModal>,
		);
	};

	if (countSelected === 0) {
		return null;
	}

	return <HeaderToolbarAction icon='trash' title={t('Delete_selected_messages')} onClick={handleMultiDelete} disabled={isDeleting} />;
};

export default MultiDeleteButton;
