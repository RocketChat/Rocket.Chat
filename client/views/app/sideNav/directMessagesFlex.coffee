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
					subscription: 'roomSearch'
					field: 'name'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					filter:
						type: 'u'
						_id: { $ne: Meteor.userId() }
					sort: 'name'
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

	'click .save-direct-message': (e, instance) ->
		err = SideNav.validate()
		if not err
			Meteor.call 'createDirectMessage', instance.selectedUser.get(), (err, result) ->
				if err
					return toastr.error err.reason
				SideNav.closeFlex()
				instance.clearForm()
				Router.go 'room', { _id: result.rid }
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
