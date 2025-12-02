import type { SlashCommand } from '@rocket.chat/core-typings';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { slashCommands } from '../../app/utils/client/slashCommand';

type SlashCommandBasicInfo = Pick<SlashCommand, 'clientOnly' | 'command' | 'description' | 'params' | 'providesPreview' | 'appId'>;

export const useAppSlashCommands = () => {
	const apps = useStream('apps');
	const uid = useUserId();

	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');

	const commands = useRef<SlashCommandBasicInfo[]>([]);

	const { mutate } = useMutation({
		mutationFn: async () => {
			const fetchBatch = async (currentOffset: number, accumulator: SlashCommandBasicInfo[] = []): Promise<SlashCommandBasicInfo[]> => {
				const count = 50;
				const { commands, total } = await getSlashCommands({ offset: currentOffset, count });

				const appsCommands = commands.filter(({ appId }) => Boolean(appId));

				const newAccumulator = [...accumulator, ...appsCommands];

				if (currentOffset + count < total) {
					return fetchBatch(currentOffset + count, newAccumulator);
				}

				return newAccumulator;
			};

			return fetchBatch(0);
		},
		onSuccess: (appsCommands) => {
			commands.current = appsCommands;
		},
		onError: () => {
			commands.current = [];
		},
		onMutate: () => commands.current.forEach(({ command }) => delete slashCommands.commands[command]),
		onSettled: () => commands.current.forEach((command) => slashCommands.add(command)),
	});

	useEffect(() => {
		if (!uid) {
			return;
		}

		mutate();

		return apps('apps', ([key]) => {
			if (key.startsWith('command/')) {
				mutate();
			}
		});
	}, [apps, uid, mutate]);
};
