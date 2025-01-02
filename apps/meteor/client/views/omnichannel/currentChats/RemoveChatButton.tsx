import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRemoveCurrentChatMutation } from './hooks/useRemoveCurrentChatMutation';
import GenericModal from '../../../components/GenericModal';

type RemoveChatButtonProps = { _id: string };

const RemoveChatButton = ({ _id }: RemoveChatButtonProps) => {
	const removeCurrentChatMutation = useRemoveCurrentChatMutation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const handleRemoveClick = useMutableCallback(async () => {
		removeCurrentChatMutation.mutate(_id);
	});

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteAgent = async (): Promise<void> => {
			try {
				await handleRemoveClick();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		setModal(
			<GenericModal
				variant='danger'
				data-qa-id='current-chats-modal-remove'
				onConfirm={onDeleteAgent}
				onCancel={() => setModal(null)}
				confirmText={t('Delete')}
			/>,
		);
	});

	return <IconButton danger small icon='trash' title={t('Remove')} disabled={removeCurrentChatMutation.isPending} onClick={handleDelete} />;
};

export default RemoveChatButton;
