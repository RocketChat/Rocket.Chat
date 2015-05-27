Template.privateGroups.helpers
	tRoomMembers: ->
		'User'

	selectedUsers: ->
		console.log 'selected ->',Template.instance().selectedUsers.get()
		return Template.instance().selectedUsers.get()

	name: ->
		console.log 'dado ->',this.valueOf()
		return Template.instance().selectedUserNames[this.valueOf()]

	autocompleteSettingsRoomSearch: ->
		console.log 'nin ->',Template.instance().selectedUsers.get()
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
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
							{ _id: { $nin: Template.instance().selectedUsers.get() } }
						]
					sort: 'name'
				}
			]
		}

Template.privateGroups.events
	'click .add-room': (e, instance) ->
		instance.selectedUsers.set([])

		$('.private-group-flex').removeClass('_hidden')

		$('#pvt-room-name').focus()

	'click .close-nav-flex': ->
		$('.private-group-flex').addClass('_hidden')

	'autocompleteselect #pvt-room-members': (event, instance, doc) ->
		instance.selectedUsers.set instance.selectedUsers.get().concat doc._id

		instance.selectedUserNames[doc._id] = doc.name

		event.currentTarget.value = ''
		event.currentTarget.focus()

		console.log doc, instance.selectedUsers.get()

	'click .remove-room-member': (e, instance) ->
		self = @

		users = Template.instance().selectedUsers.get()
		users = _.reject Template.instance().selectedUsers.get(), (_id) ->
			return _id is self.valueOf()

		Template.instance().selectedUsers.set(users)

		$('#pvt-room-members').focus()

Template.privateGroups.onCreated ->
	this.selectedUsers = new ReactiveVar []
	this.selectedUserNames = {}
