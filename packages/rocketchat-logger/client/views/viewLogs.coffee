Template.viewLogs.onCreated ->
	@subscribe 'stdout'

Template.viewLogs.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'view-logs'

	logs: ->
		return stdout.find({}, {sort: {ts: 1}})

	ansispan: (string) ->
		string = ansispan(string.replace(/\s/g, '&nbsp;').replace(/(\\n|\n)/g, '<br>'))
		string = string.replace(/(.\d{8}-\d\d:\d\d:\d\d\.\d\d\d\(?.{0,2}\)?)/, '<span class="time">$1</span>')
		return string

	formatTS: (date) ->
		return moment(date).format('YMMDD-HH:mm:ss.SSS(ZZ)')
