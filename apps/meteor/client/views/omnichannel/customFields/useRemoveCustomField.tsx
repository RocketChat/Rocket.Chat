import { useConfirmAction } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { omnichannelQueryKeys } from '../../../lib/queryKeys';

export const useRemoveCustomField = () => {
	const { t } = useTranslation();
	const removeCustomField = useEndpoint('POST', '/v1/livechat/custom-fields.delete');
	const queryClient = useQueryClient();

	return useConfirmAction(
		async (id: string) => {
			await removeCustomField({ customFieldId: id });
			queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.livechat.customFields() });
		},
		{ successMessage: t('Custom_Field_Removed') },
	);
};
