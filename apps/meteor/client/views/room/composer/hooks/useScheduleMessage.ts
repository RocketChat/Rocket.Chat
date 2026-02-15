import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

type ScheduleMessageParams = {
	roomId: string;
	message: string;
	scheduledAt: Date;
	tmid?: string;
	previewUrls?: string[];
	tshow?: boolean;
};

export const useScheduleMessage = () => {
	const scheduleMessage = useEndpoint('POST', '/v1/chat.scheduleMessage');

	return useMutation({
		mutationFn: async ({ roomId, message, scheduledAt, tmid, previewUrls, tshow }: ScheduleMessageParams) => {
			const result = await scheduleMessage({
				roomId,
				message,
				scheduledAt: scheduledAt.toISOString(),
				tmid,
				previewUrls,
				tshow,
			});
			return result.scheduledMessage;
		},
	});
};

export const useGetScheduledMessages = (roomId?: string) => {
	const getScheduledMessages = useEndpoint('GET', '/v1/chat.getScheduledMessages');

	return useMutation({
		mutationFn: async () => {
			const result = await getScheduledMessages({
				roomId,
				status: 'pending',
				count: 50,
				offset: 0,
			});
			return result.scheduledMessages;
		},
	});
};

export const useCancelScheduledMessage = () => {
	const cancelScheduledMessage = useEndpoint('DELETE', '/v1/chat.cancelScheduledMessage');

	return useMutation({
		mutationFn: async (messageId: string) => {
			await cancelScheduledMessage({ messageId });
		},
	});
};
