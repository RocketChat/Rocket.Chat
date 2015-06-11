Template.createChannelFlex.helpers
	selectedUsers: ->
		return Template.instance().selectedUsers.get()

	name: ->
		return Template.instance().selectedUserNames[this.valueOf()]

	error: ->
		return Template.instance().error.get()

	roomName: ->
		return Template.instance().roomName.get()

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
						$and: [
							{ _id: { $ne: Meteor.userId() } }
							{ username: { $nin: Template.instance().selectedUsers.get() } }
						]
					sort: 'name'
				}
			]
		}

Template.createChannelFlex.events
	'autocompleteselect #channel-members': (event, instance, doc) ->
		instance.selectedUsers.set instance.selectedUsers.get().concat doc.username

		instance.selectedUserNames[doc.username] = doc.name

		event.currentTarget.value = ''
		event.currentTarget.focus()

	'click .remove-room-member': (e, instance) ->
		self = @

		users = Template.instance().selectedUsers.get()
		users = _.reject Template.instance().selectedUsers.get(), (_id) ->
			return _id is self.valueOf()

		Template.instance().selectedUsers.set(users)

		$('#channel-members').focus()

	'click header': (e, instance) ->
		SideNav.closeFlex()

	'click .cancel-channel': (e, instance) ->
		SideNav.closeFlex()

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()

	'click footer .all': ->
		SideNav.setFlex "listChannelsFlex"

	'keydown input[type="text"]': (e, instance) ->
		Template.instance().error.set([])

	'click .save-channel': (e, instance) ->
		err = SideNav.validate()
		instance.roomName.set instance.find('#channel-name').value
		console.log err
		if not err
			Meteor.call 'createChannel', instance.find('#channel-name').value, instance.selectedUsers.get(), (err, result) ->
				if err
					console.log err
					if err.error is 'name-invalid'
						instance.error.set({ invalid: true })
						return
					else
						return toastr.error err.reason

				SideNav.closeFlex()

				instance.clearForm()

				Router.go 'room', { _id: result.rid }
		else
			instance.error.set({ fields: err })

Template.createChannelFlex.onCreated ->
	instance = this
	instance.selectedUsers = new ReactiveVar []
	instance.selectedUserNames = {}
	instance.error = new ReactiveVar []
	instance.roomName = new ReactiveVar ''

	instance.clearForm = ->
		instance.error.set([])
		instance.roomName.set('')
		instance.selectedUsers.set([])
		instance.find('#channel-name').value = ''
		instance.find('#channel-members').value = ''
