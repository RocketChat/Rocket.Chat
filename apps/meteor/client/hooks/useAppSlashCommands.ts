import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSingleStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { slashCommands } from '../../app/utils/lib/slashCommand';

export const useAppSlashCommands = () => {
	const queryClient = useQueryClient();

	const apps = useSingleStream('apps');
	const uid = useUserId();

	const invalidate = useDebouncedCallback(() => {
		queryClient.invalidateQueries(['apps', 'slashCommands']);
	}, 100);

	useEffect(() => {
		if (!uid) {
			return;
		}
		return apps('apps', ([key, [command]]) => {
			switch (key) {
				case 'command/removed':
					if (typeof command === 'string') {
						delete slashCommands.commands[command];
					}
					invalidate();
					break;
				case 'command/added':
				case 'command/updated':
				case 'command/disabled':
					invalidate();
			}
		});
	}, [apps, queryClient, uid, invalidate]);

	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');

	useQuery(['apps', 'slashCommands'], () => getSlashCommands(), {
		enabled: !!uid,
		onSuccess(data) {
			data.commands.forEach((command) => slashCommands.add(command));
		},
	});
};
