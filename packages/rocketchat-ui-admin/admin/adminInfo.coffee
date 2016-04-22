Template.adminInfo.helpers
	isReady: ->
		return Template.instance().ready.get()
	statistics: ->
		return Template.instance().statistics.get()
	inGB: (size) ->
		if size > 1073741824
			return _.numberFormat(size / 1024 / 1024 / 1024, 2) + ' GB'
		return _.numberFormat(size / 1024 / 1024, 2) + ' MB'
	humanReadableTime: (time) ->
		days = Math.floor time / 86400
		hours = Math.floor (time % 86400) / 3600
		minutes = Math.floor ((time % 86400) % 3600) / 60
		seconds = Math.floor ((time % 86400) % 3600) % 60
		out = ""
		if days > 0
			out += "#{days} #{TAPi18n.__ 'days'}, "
		if hours > 0
			out += "#{hours} #{TAPi18n.__ 'hours'}, "
		if minutes > 0
			out += "#{minutes} #{TAPi18n.__ 'minutes'}, "
		if seconds > 0
			out += "#{seconds} #{TAPi18n.__ 'seconds'}"
		return out
	formatDate: (date) ->
		if date
			return moment(date).format("LLL")
	numFormat: (number) ->
		return _.numberFormat(number, 2)
	info: ->
		return RocketChat.Info
	build: ->
		return RocketChat.Info?.compile || RocketChat.Info?.build

Template.adminInfo.events
	'click .refresh': (e, instance) ->
		instance.ready.set false
		Meteor.call 'getStatistics', true, (error, statistics) ->
			instance.ready.set true
			if error
				handleError(error)
			else
				instance.statistics.set statistics

Template.adminInfo.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

Template.adminInfo.onCreated ->
	instance = @
	@statistics = new ReactiveVar {}
	@ready = new ReactiveVar false

	if RocketChat.authz.hasAllPermission('view-statistics')
		Meteor.call 'getStatistics', (error, statistics) ->
			instance.ready.set true
			if error
				handleError(error)
			else
				instance.statistics.set statistics

