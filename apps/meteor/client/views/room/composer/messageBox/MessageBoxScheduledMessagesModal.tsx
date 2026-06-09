import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Box, Button, Icon, Throbber } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type MessageBoxScheduledMessagesModalProps = {
	roomId: string;
	onClose: () => void;
};

export const MessageBoxScheduledMessagesModal = ({ roomId, onClose }: MessageBoxScheduledMessagesModalProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [scheduledMessages, setScheduledMessages] = useState<IMessage[]>([]);
	const [loading, setLoading] = useState(true);

	const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');
	const cancelScheduledMessage = useEndpoint('POST', '/v1/chat.cancelScheduledMessage');

	const loadScheduledMessages = useMemo(
		() => async () => {
			try {
				setLoading(true);
				const result = await getScheduledMessages({ roomId });
				const messages = result.messages.map((msg: any) => ({
					...msg,
					ts: typeof msg.ts === 'string' ? new Date(msg.ts) : msg.ts,
					scheduledAt: typeof msg.scheduledAt === 'string' ? new Date(msg.scheduledAt) : msg.scheduledAt,
				}));
				setScheduledMessages(messages);
			} catch (error: any) {
				dispatchToastMessage({ type: 'error', message: error.message });
			} finally {
				setLoading(false);
			}
		},
		[roomId, getScheduledMessages, dispatchToastMessage],
	);

	useEffect(() => {
		loadScheduledMessages();
	}, [loadScheduledMessages]);

	const handleCancel = async (messageId: string) => {
		try {
			await cancelScheduledMessage({ messageId });
			dispatchToastMessage({ type: 'success', message: t('Scheduled_message_cancelled') });
			await loadScheduledMessages();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error.message });
		}
	};

	const formatDate = (date: Date | string | undefined) => {
		if (!date) return '';
		return new Date(date).toLocaleString();
	};

	return (
		<GenericModal
			title={t('Scheduled_Messages')}
			onClose={onClose}
			onConfirm={onClose}
			confirmText={t('Close')}
		>
			{loading ? (
				<Box display='flex' justifyContent='center' p='x24'>
					<Throbber />
				</Box>
			) : scheduledMessages.length === 0 ? (
				<Box textAlign='center' p='x24' color='hint'>
					{t('No_scheduled_messages')}
				</Box>
			) : (
				<Box>
					{scheduledMessages.map((message) => (
						<Box
							key={message._id}
							p='x16'
							mb='x8'
							borderWidth='x1'
							borderColor='neutral-300'
							borderRadius='x4'
							display='flex'
							flexDirection='column'
							gap='x8'
						>
							<Box display='flex' justifyContent='space-between' alignItems='center'>
								<Box fontScale='p2' color='hint'>
									<Icon name='clock' size='x16' /> {formatDate(message.scheduledAt)}
								</Box>
							</Box>
							<Box fontScale='p2' style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
								{message.msg}
							</Box>
							<Box display='flex' justifyContent='flex-end'>
								<Button
									small
									danger
									onClick={() => handleCancel(message._id)}
									title={t('Cancel')}
									mis='x8'
								>
									<Icon name='trash' size='x16' />
								</Button>
							</Box>
						</Box>
					))}
				</Box>
			)}
		</GenericModal>
	);
};
