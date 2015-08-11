Template.userSearch.onCreated ->
	instance = this

	# List used to track if users in the drop-down dialog have access to the room
	instance.workingUserAccessList = new ReactiveDict


	# Tracker.autorun function that gets executed on template creation, and then re-executed
	# on changes to the reactive inputs (in this case, a session variable). If the 'warnLabelIds'
	# variable is ever changed, this function will reset the 'workingUserAccessList'. This
	# is to make sure that the styling for the members drop-down menu is reactive to changes
	# in the room security labels.
	#
	# Since function is tied to Template instance, will automatically stop on template
	# destroy (http://docs.meteor.com/#/full/template_autorun).
	instance.autorun (c) ->
		list = Session.get 'warnLabelIds'
		instance.workingUserAccessList = new ReactiveDict



Template.userSearch.helpers
	# Helper used to indicate a user in the drop-down list cannot access the room. Used in
	# the template to set a CSS style on the user list element.
	warnUser: ->
		# 'this' === entire (published) user doc
		selectedLabelIds = Session.get('selectedLabelIds') or []
		user = this.username
		instance = Template.instance()
		if selectedLabelIds.length > 0
			Meteor.call 'canAccessResource', [Meteor.userId(), user], selectedLabelIds, (error, result) ->
				if not error
					instance.workingUserAccessList.set user, result.canAccess

		warn = instance.workingUserAccessList.get user
		if warn? and warn is false
			return 'warning-user-label'
		else
			return ''