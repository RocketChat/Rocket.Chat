Template.adminStatistics.helpers
	isAdmin: ->
		return Meteor.user().admin is true
	isReady: ->
		return Template.instance().ready.get()
	statistics: ->
		return Template.instance().statistics.get()
	inGB: (size) ->
		if size > 1073741824
			return _.numberFormat(size / 1024 / 1024 / 1024, 2) + ' GB'
		return _.numberFormat(size / 1024 / 1024, 2) + ' MB'
	humanReadable: (time) ->
		days = Math.floor time / 86400
		hours = Math.floor (time % 86400) / 3600
		minutes = Math.floor ((time % 86400) % 3600) / 60
		seconds = Math.floor ((time % 86400) % 3600) % 60
		out = ""
		if days > 0
			out += "#{days} #{TAPi18next.t 'project:days'}, "
		if hours > 0
			out += "#{hours} #{TAPi18next.t 'project:hours'}, "
		if minutes > 0
			out += "#{minutes} #{TAPi18next.t 'project:minutes'}, "
		if seconds > 0
			out += "#{seconds} #{TAPi18next.t 'project:seconds'}"
		return out
	numFormat: (number) ->
		return _.numberFormat(number, 2)

Template.adminStatistics.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

Template.adminStatistics.onCreated ->
	instance = @
	@statistics = new ReactiveVar {}
	@ready = new ReactiveVar false

	Meteor.call 'generateStatistics', (error, statistics) ->
		instance.ready.set true
		if error
			toastr.error error.reason
		else
			instance.statistics.set statistics
