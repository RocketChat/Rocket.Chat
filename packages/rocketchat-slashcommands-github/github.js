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
		{ value: 'submit',
			description: 'Submit a new issue',
			params: [
				{
					value: 'repo',
					description: 'Repo'

				}, {
					value: 'title',
					description: 'Title for your issue'
				}, {
					value: 'description',
					description: 'Description for your issue'
				}]
		}, {
			value:'assign',
			description: 'Assign an issue from a repo to an user'

		}, {
			value:'close',
			description: 'Close an issue from a repo'

		}, {
			value: 'delete',
			description: 'Delete an issue from a repo',
			params: [
				{
					value: 'repo',
					description: 'Repository'

				}, {
					value: 'issue',
					description: 'Issue'

				}]
		}]
});
