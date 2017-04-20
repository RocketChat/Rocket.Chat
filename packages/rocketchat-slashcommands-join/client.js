RocketChat.slashCommands.add('join', undefined, {
	description: 'Join_the_given_channel',
	params: '#channel'
}, function(err, result, params) {
	if (err.error === 'error-user-already-in-room') {
		params.cmd = 'open';
		params.msg.msg = params.msg.msg.replace('join', 'open');
		return RocketChat.slashCommands.run('open', params.params, params.msg);
	}
});
