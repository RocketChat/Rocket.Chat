RocketChat.slashCommands.add 'msg', (command, params, item) ->
	trimmedParams = params.trim()

	username = trimmedParams.slice(0, trimmedParams.indexOf(' '))

	if username is ''
		return
	username = username.replace('@', '')

	if Session.get('showUserInfo') is username
		Session.set('showUserInfo', null)
,
	description: TAPi18n.__ 'Direct_message_someone'
	params: '@username <message>'
