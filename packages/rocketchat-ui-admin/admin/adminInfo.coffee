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
	optOut: ->
		return RocketChat.settings.get 'Statistics_opt_out'
	info: ->
		return RocketChat.Info
	build: ->
		return RocketChat.Info?.compile || RocketChat.Info?.build

Template.adminInfo.events
	'click input[name=opt-out-statistics]': (e) ->
		if $(e.currentTarget).prop('checked')
			$('#opt-out-warning').show()
			RocketChat.settings.set 'Statistics_opt_out', true, ->
				toastr.success TAPi18n.__ 'Settings_updated'
		else
			$('#opt-out-warning').hide()
			RocketChat.settings.set 'Statistics_opt_out', false, ->
				toastr.success TAPi18n.__ 'Settings_updated'

	'click .refresh': (e, instance) ->
		instance.ready.set false
		Meteor.call 'getStatistics', true, (error, statistics) ->
			instance.ready.set true
			if error
				toastr.error error.reason
			else
				instance.statistics.set statistics

Template.adminInfo.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

		if RocketChat.settings.get 'Statistics_opt_out'
			$('#opt-out-warning').show()
		else
			$('#opt-out-warning').hide()

Template.adminInfo.onCreated ->
	instance = @
	@statistics = new ReactiveVar {}
	@ready = new ReactiveVar false

	if RocketChat.authz.hasAllPermission('view-statistics')
		Meteor.call 'getStatistics', (error, statistics) ->
			instance.ready.set true
			if error
				toastr.error error.reason
			else
				instance.statistics.set statistics

