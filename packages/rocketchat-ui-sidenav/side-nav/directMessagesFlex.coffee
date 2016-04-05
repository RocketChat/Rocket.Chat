Template.directMessagesFlex.helpers
	error: ->
		return Template.instance().error.get()

	autocompleteSettings: ->
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					# @TODO maybe change this 'collection' and/or template
					collection: 'UserAndRoom'
					subscription: 'userAutocomplete'
					field: 'username'
					template: Template.userSearch
					noMatchTemplate: Template.userSearchEmpty
					matchAll: true
					filter:
						exceptions: [Meteor.user().username]
					selector: (match) ->
						return { username: match }
					sort: 'username'
				}
			]
		}

Template.directMessagesFlex.events
	'autocompleteselect #who': (event, instance, doc) ->
		instance.selectedUser.set doc.username
		event.currentTarget.focus()

	'click .cancel-direct-message': (e, instance) ->
		SideNav.closeFlex()
		instance.clearForm()

	'click header': (e, instance) ->
		SideNav.closeFlex()
		instance.clearForm()

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'keydown input[type="text"]': (e, instance) ->
		Template.instance().error.set([])
		if e.keyCode is 13
			instance.$('.save-direct-message').click()

	'click .save-direct-message': (e, instance) ->
		err = SideNav.validate()
		if not err
			username = instance.selectedUser.get()
			return unless username?

			Meteor.call 'createDirectMessage', username, (err, result) ->
				if err
					return toastr.error err.reason
				SideNav.closeFlex()
				instance.clearForm()
				FlowRouter.go 'direct', { username: username }
		else
			Template.instance().error.set(err)

Template.directMessagesFlex.onCreated ->
	instance = this
	instance.selectedUser = new ReactiveVar
	instance.error = new ReactiveVar []

	instance.clearForm = ->
		instance.error.set([])
		instance.selectedUser.set null
		instance.find('#who').value = ''
