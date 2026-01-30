import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type UseRemoveWebDAVAccountIntegrationMutationOptions = Omit<UseMutationOptions<void, unknown, { accountSelected: string }>, 'mutationFn'>;

export const useRemoveWebDAVAccountIntegrationMutation = (options?: UseRemoveWebDAVAccountIntegrationMutationOptions) => {
	const removeWebdavAccount = useEndpoint('POST', '/v1/webdav.removeWebdavAccount');

	return useMutation({
		mutationFn: async ({ accountSelected }: { accountSelected: string }) => {
			await removeWebdavAccount({ accountId: accountSelected });
		},
		...options,
	});
};
