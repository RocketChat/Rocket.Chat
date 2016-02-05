Template.viewLogs.onCreated ->
	@subscribe 'stdout'

Template.viewLogs.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'view-logs'

	logs: ->
		return stdout.find({}, {sort: {ts: 1}})

	ansispan: (string) ->
		return ansispan(string.replace(/\s/g, '&nbsp;').replace(/(\\n|\n)/g, '<br>'))

	formatTS: (date) ->
		return moment(date).format('YMMDD-HH:mm:ss.SSS(ZZ)')
