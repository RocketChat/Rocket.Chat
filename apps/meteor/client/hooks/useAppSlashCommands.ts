import type { SlashCommand } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { slashCommands } from '../../app/utils/client/slashCommand';
import { appsQueryKeys } from '../lib/queryKeys';

type SlashCommandBasicInfo = Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>;

export const useAppSlashCommands = () => {
	const queryClient = useQueryClient();

	const apps = useStream('apps');
	const uid = useUserId();

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries({
				queryKey: appsQueryKeys.slashCommands(),
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
			if (!key.startsWith('command/')) {
				return;
			}

			if (['command/removed', 'command/disabled'].includes(key) && typeof command === 'string') {
				delete slashCommands.commands[command];
			}

			invalidate();
		});
	}, [apps, uid, invalidate]);

	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');

	const { data } = useQuery({
		queryKey: appsQueryKeys.slashCommands(),
		enabled: !!uid,
		structuralSharing: false,
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
	});

	/**
	 * We're deliberately not using `useEffect` here because we want the forEach to run on every call
	 *
	 * What we considered:
	 *
	 * 1. Slash command list is really small (< 100 items)
	 * 2. `slashCommands.add` is idempotent
	 * 3. `slashCommands.add` doesn't trigger re-renders
	 *
	 * @TODO the `slashCommands` singleton should be refactored to fit the React data flow
	 */
	data?.forEach((command) => slashCommands.add(command));
};
