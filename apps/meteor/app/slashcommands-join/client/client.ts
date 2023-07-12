import type { Meteor } from 'meteor/meteor';

import { ui } from '../../../client/lib/ui';

ui.addSlashCommand({
	command: 'join',
	options: {
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
	result(err, _result: unknown, params: Record<string, any>) {
		if ((err as Meteor.Error).error === 'error-user-already-in-room') {
			params.cmd = 'open';
			params.msg.msg = params.msg.msg.replace('join', 'open');
			return void ui.runSlashCommand({ command: 'open', params: params.params, message: params.msg, triggerId: '', userId: params.userId });
		}
	},
});
