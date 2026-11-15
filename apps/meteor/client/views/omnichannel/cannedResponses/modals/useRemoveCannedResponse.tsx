import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useConfirmAction } from '@rocket.chat/ui-client';
import { useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveCannedResponse = (id: IOmnichannelCannedResponse['_id']) => {
	const { t } = useTranslation();
	const router = useRouter();
	const queryClient = useQueryClient();
	const removeCannedResponse = useEndpoint('DELETE', '/v1/canned-responses/:_id', { _id: id });

	return useConfirmAction(
		async () => {
			await removeCannedResponse();
			queryClient.invalidateQueries({ queryKey: ['getCannedResponses'] });
			router.navigate('/omnichannel/canned-responses');
		},
		{ successMessage: t('Canned_Response_Removed') },
	);
};
