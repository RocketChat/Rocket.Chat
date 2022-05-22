import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';

slashCommands.add(
	'join',
	undefined,
	{
		description: 'Join_the_given_channel',
		params: '#channel',
		permission: 'view-c-room',
	},
	function (err: Meteor.Error, _result: unknown, params: Record<string, any>) {
		if (err.error === 'error-user-already-in-room') {
			params.cmd = 'open';
			params.msg.msg = params.msg.msg.replace('join', 'open');
			return slashCommands.run('open', params.params, params.msg, '');
		}
	},
);
