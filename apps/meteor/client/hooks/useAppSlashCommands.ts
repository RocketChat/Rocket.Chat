import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { slashCommands } from '../../app/utils/client/slashCommand';

export const useAppSlashCommands = () => {
	const queryClient = useQueryClient();

	const apps = useStream('apps');
	const uid = useUserId();

	const invalidate = useDebouncedCallback(
		() => {
			queryClient.invalidateQueries(['apps', 'slashCommands']);
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

	useQuery(['apps', 'slashCommands'], () => getSlashCommands(), {
		enabled: !!uid,
		onSuccess(data) {
			data.commands.forEach((command) => slashCommands.add(command));
		},
	});
};
