import { slashCommands } from '../../lib/slashCommand';

slashCommands.add({
	command: 'join',
	options: {
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
	result(err, _result: unknown, params: Record<string, any>) {
		if ((err as { error?: string } | undefined)?.error === 'error-user-already-in-room') {
			params.cmd = 'open';
			// oxlint-disable-next-line typescript/no-unsafe-call -- SlashCommand['result'] data omits the userId passed at runtime
			params.msg.msg = params.msg.msg.replace('join', 'open');
			return void slashCommands.run({ command: 'open', params: params.params, message: params.msg, triggerId: '', userId: params.userId });
		}
	},
});
