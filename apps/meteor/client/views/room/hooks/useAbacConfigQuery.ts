import { useConnectionStatus, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { ABACQueryKeys } from '../../../lib/queryKeys';
import { useIsABACAvailable } from '../../admin/ABAC/hooks/useIsABACAvailable';

export const useAbacConfigQuery = () => {
	const queryClient = useQueryClient();
	const isABACAvailable = useIsABACAvailable();
	const subscribeToNotifyLogged = useStream('notify-logged');
	const { connected } = useConnectionStatus();
	const wasConnectedRef = useRef(connected);

	const getAbacConfig = useEndpoint('GET', '/v1/abac/config');

	useEffect(() => {
		if (!isABACAvailable) {
			return;
		}

		return subscribeToNotifyLogged('abac-config-changed', () => {
			void queryClient.invalidateQueries({ queryKey: ABACQueryKeys.config() });
		});
	}, [isABACAvailable, queryClient, subscribeToNotifyLogged]);

	useEffect(() => {
		if (connected && !wasConnectedRef.current) {
			void queryClient.invalidateQueries({ queryKey: ABACQueryKeys.config() });
		}

		wasConnectedRef.current = connected;
	}, [connected, queryClient]);

	return useQuery({
		queryKey: ABACQueryKeys.config(),
		queryFn: () => getAbacConfig(),
		enabled: isABACAvailable,
		staleTime: Infinity,
	});
};
