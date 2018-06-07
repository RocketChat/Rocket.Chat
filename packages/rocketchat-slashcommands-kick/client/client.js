RocketChat.slashCommands.add('kick', function(command, params) {
	const username = params.trim();
	if (username === '') {
		return;
	}
	return username.replace('@', '');
}, {
	description: 'Remove_someone_from_room',
	params: '@username'
});
