import { useConfirmAction } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveBusinessHour = () => {
	const { t } = useTranslation();
	const removeBusinessHour = useEndpoint('POST', '/v1/livechat/business-hours.remove');
	const queryClient = useQueryClient();

	return useConfirmAction(
		async (_id: string, type: string) => {
			await removeBusinessHour({ _id, type });
			queryClient.invalidateQueries({ queryKey: ['livechat-getBusinessHours'] });
		},
		{ successMessage: t('Business_Hour_Removed') },
	);
};
