import type { IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Box, Callout, Throbber } from '@rocket.chat/fuselage';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarDialog,
	ContextualbarEmptyContent,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	GenericModal,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRoomToolbox, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ScheduledMessageItem from './ScheduledMessageItem';
import { roomsQueryKeys } from '../../../../lib/queryKeys';
import ScheduleMessageModal from '../../composer/ScheduleMessageModal';
import { useRoom } from '../../contexts/RoomContext';

/** Matches the cron cadence of the server-side dispatcher. */
const DISPATCHER_INTERVAL_MS = 60 * 1000;

const ScheduledMessagesTab = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const { closeTab } = useRoomToolbox();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');
	const deleteScheduledMessage = useEndpoint('POST', '/v1/chat.deleteScheduledMessage');

	const { data, isPending, isSuccess, error } = useQuery({
		queryKey: roomsQueryKeys.scheduledMessages(room._id),
		queryFn: () => getScheduledMessages({ rid: room._id }),
		// the dispatcher delivers due messages once a minute; without this the list keeps showing
		// messages that have already been sent for as long as the tab stays open
		refetchInterval: DISPATCHER_INTERVAL_MS,
	});

	const { mutate: removeScheduledMessage } = useMutation({
		mutationFn: async (id: IScheduledMessage['_id']) => deleteScheduledMessage({ id }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Scheduled_message_deleted') });
			void queryClient.invalidateQueries({ queryKey: roomsQueryKeys.scheduledMessages(room._id) });
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const handleEdit = (scheduledMessage: Serialized<IScheduledMessage>) => {
		setModal(<ScheduleMessageModal rid={room._id} scheduledMessage={scheduledMessage} onClose={() => setModal(null)} />);
	};

	const handleDelete = (scheduledMessage: Serialized<IScheduledMessage>) => {
		setModal(
			<GenericModal
				variant='danger'
				title={t('Delete_scheduled_message')}
				confirmText={t('Delete')}
				onConfirm={() => {
					removeScheduledMessage(scheduledMessage._id);
					setModal(null);
				}}
				onCancel={() => setModal(null)}
				onClose={() => setModal(null)}
			>
				{t('Delete_scheduled_message_warning')}
			</GenericModal>,
		);
	};

	const scheduledMessages = data?.messages ?? [];

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='clock' />
				<ContextualbarTitle>{t('Scheduled_messages')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<ContextualbarContent paddingInline={0}>
				{isPending && (
					<Box paddingInline={24} paddingBlock={12}>
						<Throbber size='x12' />
					</Box>
				)}
				{error instanceof Error && (
					<Callout marginInline={24} type='danger'>
						{error.message}
					</Callout>
				)}
				{isSuccess && scheduledMessages.length === 0 && <ContextualbarEmptyContent title={t('No_scheduled_messages')} />}
				{isSuccess && scheduledMessages.length > 0 && (
					<Box paddingBlock={12}>
						{scheduledMessages.map((scheduledMessage) => (
							<ScheduledMessageItem
								key={scheduledMessage._id}
								scheduledMessage={scheduledMessage}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}
					</Box>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default ScheduledMessagesTab;
