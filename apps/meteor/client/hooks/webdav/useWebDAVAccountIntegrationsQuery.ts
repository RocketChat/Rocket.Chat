import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { useUserId, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

type UseWebDAVAccountIntegrationsQueryOptions = Omit<
	UseQueryOptions<IWebdavAccountIntegration[], unknown, IWebdavAccountIntegration[], readonly ['webdav', 'account-integrations']>,
	'queryKey' | 'queryFn'
>;

export const useWebDAVAccountIntegrationsQuery = ({ enabled = true, ...options }: UseWebDAVAccountIntegrationsQueryOptions = {}) => {
	const uid = useUserId();

	const queryKey = useMemo(() => ['webdav', 'account-integrations'] as const, []);

	const getMyAccounts = useEndpoint('GET', '/v1/webdav.getMyAccounts');

	const integrationsQuery = useQuery({
		queryKey,
		queryFn: async (): Promise<IWebdavAccountIntegration[]> => {
			const { accounts } = await getMyAccounts();
			return accounts;
		},
		enabled: !!uid && enabled,
		staleTime: Infinity,
		...options,
	});

	const queryClient = useQueryClient();

	const subscribeToNotifyUser = useStream('notify-user');

	useEffect(() => {
		if (!uid || !enabled) {
			return;
		}

		return subscribeToNotifyUser(`${uid}/webdav`, ({ type, account }) => {
			switch (type) {
				case 'changed':
					queryClient.invalidateQueries({ queryKey });
					break;

				case 'removed':
					queryClient.setQueryData<IWebdavAccountIntegration[]>(queryKey, (old = []) => {
						return old.filter((oldAccount) => oldAccount._id !== account._id);
					});
					break;
			}
		});
	}, [enabled, queryClient, queryKey, uid, subscribeToNotifyUser]);

	return integrationsQuery;
};
