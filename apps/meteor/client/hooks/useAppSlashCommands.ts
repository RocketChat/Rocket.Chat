import type { SlashCommand } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { slashCommands } from '../../app/utils/client/slashCommand';

type SlashCommandBasicInfo = Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>;

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
			const fetchBatch = async (currentOffset: number, accumulator: SlashCommandBasicInfo[] = []): Promise<SlashCommandBasicInfo[]> => {
				const count = 50;
				const { commands, total } = await getSlashCommands({ offset: currentOffset, count });

				const newAccumulator = [...accumulator, ...commands];

				if (newAccumulator.length < total) {
					return fetchBatch(currentOffset + count, newAccumulator);
				}

				return newAccumulator;
			};

			return fetchBatch(0);
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
