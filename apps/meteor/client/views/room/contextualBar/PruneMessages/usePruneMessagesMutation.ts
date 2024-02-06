import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const usePruneMessagesMutation = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const pruneMessagesAction = useEndpoint('POST', '/v1/rooms.cleanHistory');

	return useMutation({
		mutationFn: pruneMessagesAction,
		onSuccess: ({ count }) => {
			if (count < 1) {
				throw new Error(t('No_messages_found_to_prune'));
			}

			dispatchToastMessage({ type: 'success', message: t('__count__message_pruned', { count }) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
