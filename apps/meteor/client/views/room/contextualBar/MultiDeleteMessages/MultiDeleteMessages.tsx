import { ButtonGroup, Button, Callout } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
	ContextualbarIcon,
} from '../../../../components/Contextualbar';
import GenericModal from '../../../../components/GenericModal';
import { useCountSelected, SelectedMessageContext } from '../../MessageList/contexts/SelectedMessagesContext';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const MultiDeleteMessages = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { closeTab } = useRoomToolbox();
	const { selectedMessageStore } = useContext(SelectedMessageContext);

	const [isDeleting, setIsDeleting] = useState(false);
	const countSelected = useCountSelected();

	const room = useRoom();
	const roomId = room?._id;

	useEffect(() => {
		return (): void => {
			selectedMessageStore.reset();
		};
	}, [selectedMessageStore]);

	const deleteMessageEndpoint = useEndpoint('POST', '/v1/chat.delete');

	const multiDeleteMutation = useMutation({
		mutationFn: (messageIds: string[]) => {
			return Promise.all(
				messageIds.map((mid) =>
					deleteMessageEndpoint({
						msgId: mid,
						roomId,
					}),
				),
			);
		},
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('Messages_deleted'),
			});
		},
		onError: () => {
			dispatchToastMessage({
				type: 'error',
				message: t('Error_deleting_messages'),
			});
		},
		onSettled: () => {
			setIsDeleting(false);
			setModal();
			selectedMessageStore.reset();
			closeTab();
		},
	});

	const handleConfirmDelete = () => {
		setModal(
			<GenericModal
				variant='danger'
				confirmText={t('Yes_delete_it')}
				onConfirm={() => {
					setModal();
					setIsDeleting(true);
					const messageIds = selectedMessageStore.getSelectedMessages();
					multiDeleteMutation.mutate(messageIds);
				}}
				onCancel={() => setModal()}
				title={t('Are_you_sure')}
			>
				{t('Are_you_sure_you_want_to_delete_all_selected_messages')}
			</GenericModal>,
		);
	};

	if (!roomId) {
		dispatchToastMessage({
			type: 'error',
			message: t('Error_room_not_found'),
		});
		return null;
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='trash' />
				<ContextualbarTitle>{t('Delete_Messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>

			<ContextualbarScrollableContent>
				{countSelected === 0 ? (
					<Callout type='info'>{t('No_messages_selected')}</Callout>
				) : (
					<Callout type='warning'>
						{t('You_have_selected_messages_to_delete', {
							count: countSelected,
						})}
					</Callout>
				)}
			</ContextualbarScrollableContent>

			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={closeTab}>{t('Cancel')}</Button>
					<Button primary danger disabled={isDeleting || countSelected === 0} onClick={handleConfirmDelete}>
						{isDeleting ? t('Deleting') : t('Delete')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default MultiDeleteMessages;
