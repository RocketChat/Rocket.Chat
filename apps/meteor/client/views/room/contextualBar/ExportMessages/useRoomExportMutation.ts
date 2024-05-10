import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useRoomExportMutation = () => {
	const t = useTranslation();
	const roomsExport = useEndpoint('POST', '/v1/rooms.export');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: roomsExport,
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('Your_email_has_been_queued_for_sending'),
			});
		},
		onError: (error) => {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		},
	});
};
