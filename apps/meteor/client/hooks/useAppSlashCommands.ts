import { useEndpoint, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ui } from '../lib/ui';

const stop = (...args: (() => void)[]) => args.forEach((s) => s());

export const useAppSlashCommands = () => {
	const queryClient = useQueryClient();

	const apps = useStream('apps');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}
		return stop(
			apps('command/added', () => {
				queryClient.invalidateQueries(['apps', 'slashCommands']);
			}),

			apps('command/updated', () => {
				queryClient.invalidateQueries(['apps', 'slashCommands']);
			}),

			apps('command/removed', () => {
				queryClient.invalidateQueries(['apps', 'slashCommands']);
			}),

			apps('command/disabled', () => {
				queryClient.invalidateQueries(['apps', 'slashCommands']);
			}),
		);
	}, [apps, queryClient, uid]);

	const getSlashCommands = useEndpoint('GET', '/v1/commands.list');

	useQuery(['apps', 'slashCommands'], () => getSlashCommands(), {
		onSuccess(data) {
			data.commands.forEach((command) => ui.addSlashCommand(command));
		},
	});
};
