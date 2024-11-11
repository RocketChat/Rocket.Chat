import type { IOAuthApps } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type UseOAuthAppQueryOptions = Omit<
	UseQueryOptions<IOAuthApps, unknown, IOAuthApps, readonly ['oauth-app', { readonly clientId: string | undefined }]>,
	'queryKey' | 'queryFn'
>;

export const useOAuthAppQuery = (clientId: string | undefined, options?: UseOAuthAppQueryOptions) => {
	const getOAuthApp = useEndpoint('GET', '/v1/oauth-apps.get');

	return useQuery({
		queryKey: ['oauth-app', { clientId }] as const,

		queryFn: async () => {
			if (!clientId) {
				throw new Error('Invalid OAuth client');
			}

			const { oauthApp } = await getOAuthApp({ clientId });
			return {
				...oauthApp,
				_createdAt: new Date(oauthApp._createdAt),
				_updatedAt: new Date(oauthApp._updatedAt),
			};
		},
		...options,
	});
};
