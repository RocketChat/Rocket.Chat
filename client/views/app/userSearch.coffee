Template.userSearch.onCreated ->
	instance = this

	instance.blah = new ReactiveDict
	instance.autorun (c) ->
		list = Session.get 'warnLabelIds'
		instance.blah = new ReactiveDict





Template.userSearch.helpers
	warnUser: ->
		# 'this' === entire (published) user doc
		list = Session.get('selectedLabelIds') or []
		user = this.username
		instance = Template.instance()
		if list.length > 0
			Meteor.call 'canAccessResource', [Meteor.userId(), user], list, (error, result) ->
				if not error
					instance.blah.set user, result.canAccess

		warn = instance.blah.get user
		if warn? and warn is false
			return 'warning-user-label'
		else
			return ''