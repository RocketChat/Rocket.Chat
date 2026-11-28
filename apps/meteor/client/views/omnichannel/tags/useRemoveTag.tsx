import { useConfirmAction } from '@rocket.chat/ui-client';
import { useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useRemoveTag = () => {
	const { t } = useTranslation();
	const removeTag = useEndpoint('POST', '/v1/livechat/tags.delete');
	const queryClient = useQueryClient();
	const router = useRouter();

	return useConfirmAction(
		async (tagId: string) => {
			await removeTag({ id: tagId });
			router.navigate('/omnichannel/tags');
			queryClient.invalidateQueries({ queryKey: ['livechat-tags'] });
		},
		{ successMessage: t('Tag_removed') },
	);
};
