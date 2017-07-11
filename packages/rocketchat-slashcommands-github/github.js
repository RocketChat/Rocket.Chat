/*
* Github is a named function that will replace /github commands
*/


function Github(command, params, item) {
	if (command === 'github') {
		const msg = item;
		msg.msg = `Used command: /github ${ params }`;
		Meteor.call('sendMessage', msg);
	}
}

RocketChat.slashCommands.add('github', Github, {
	description: 'Github Slashcommand',
	params: [
		{
			value:'assign',
			type: 'subcommand',
			description: 'Assign an issue from a repo to an user',
			params: [
				{
					value: ['Rocket.Chat', 'Rocket.Chat.Electron', 'Rocket.Chat.Android', 'Rocket.Chat.Rocketlet'],
					type: 'parameter',
					description: 'Repository'
				}, {
					value: ['321', '123', '443', '231', '501', '506'],
					type: 'parameter',
					description: 'Issue'
				}, {
					value: ['gdelavald', 'ggazzo', 'graywolf336', 'geekgonecrazy'],
					type: 'parameter',
					description: 'User assigned'
				}]
		}, {
			value:'close',
			type: 'subcommand',
			description: 'Close an issue from a repo'
		}, {
			value: 'delete',
			type: 'subcommand',
			description: 'Delete an issue from a repo',
			params: [
				{
					value: 'repo',
					type: 'parameter',
					description: 'Repository'
				}, {
					value: 'issue',
					type: 'parameter',
					description: 'Issue'
				}]
		}]
});
