import { useConfirmAction } from '@rocket.chat/ui-client';
import { useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveUnit = (id: string) => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const removeUnit = useEndpoint('DELETE', '/v1/livechat/units/:id', { id });

	return useConfirmAction(
		async () => {
			await removeUnit();
			router.navigate('/omnichannel/units');
			queryClient.invalidateQueries({ queryKey: ['livechat-units'] });
		},
		{ successMessage: t('Unit_removed') },
	);
};
