import type { SlashCommand } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { slashCommands } from '../../app/utils/client/slashCommand';

export const useAppSlashCommands = () => {
	const queryClient = useQueryClient();

	const apps = useStream('apps');
	const uid = useUserId();

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries({
				queryKey: ['apps', 'slashCommands'],
			});
		},
		100,
		[],
	);

	useEffect(() => {
		if (!uid) {
			return;
		}
		return apps('apps', ([key, [command]]) => {
			if (['command/added', 'command/updated', 'command/disabled', 'command/removed'].includes(key)) {
				if (typeof command === 'string') {
					delete slashCommands.commands[command];
				}
				invalidate();
			}
		});
	}, [apps, uid, invalidate]);

	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');

	const { data } = useQuery({
		queryKey: ['apps', 'slashCommands'] as const,
		queryFn: async () => {
			let allCommands: Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>[] = [];
			let hasMore = true;
			let offset = 0;
			const count = 50;

			while (hasMore) {
				// eslint-disable-next-line no-await-in-loop
				const { commands, total } = await getSlashCommands({ offset, count });
				allCommands = allCommands.concat(commands);
				hasMore = allCommands.length < total;
				offset += count;
			}

			return allCommands;
		},
		enabled: !!uid,
	});

	useEffect(() => {
		if (!data) {
			return;
		}

		data.forEach((command) => slashCommands.add(command));
	}, [data]);
};
