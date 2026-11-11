import type { ICustomUserStatus } from '@rocket.chat/core-typings';
import { useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';

import { userStatuses } from '../lib/userStatuses';
import { mapCustomUserStatusFromApi } from '../lib/utils/mapCustomUserStatusFromApi';

export const useUserStatuses = ({ enabled = true }: { enabled?: boolean } = {}) => {
	const queryClient = useQueryClient();
	const stream = useStream('notify-logged');
	const listCustomUserStatusEndpoint = useEndpoint('GET', '/v1/custom-user-status.list');
	const listCustomUserStatus = useCallback(async (): Promise<ICustomUserStatus[]> => {
		const all: ICustomUserStatus[] = [];
		const count = 100;
		let offset = 0;
		// REST endpoint is paginated; loop until total reached.
		while (true) {
			const { statuses, total } = await listCustomUserStatusEndpoint({ count, offset });
			all.push(...statuses.map(mapCustomUserStatusFromApi));
			if (all.length >= total || statuses.length === 0) break;
			offset += statuses.length;
		}
		return all;
	}, [listCustomUserStatusEndpoint]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		return userStatuses.watch(stream, () => {
			queryClient.setQueryData(['user-statuses'], Array.from(userStatuses));
		});
	}, [enabled, queryClient, stream]);

	const { data } = useQuery({
		queryKey: ['user-statuses'],
		queryFn: async () => {
			await userStatuses.sync(listCustomUserStatus);
			return Array.from(userStatuses);
		},
		staleTime: Infinity,
		enabled,
	});

	return data;
};
