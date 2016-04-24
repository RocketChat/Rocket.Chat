Template.mailMessagesInstructions.helpers
	name: ->
		return Meteor.user().name
	email: ->
		return Meteor.user().emails?[0]?.address
	roomName: ->
		return ChatRoom.findOne(Session.get('openedRoom'))?.name
	erroredEmails: ->
		return Template.instance()?.erroredEmails.get().join(', ')
	autocompleteSettings: ->
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					# @TODO maybe change this 'collection' and/or template
					collection: 'CachedChannelList'
					subscription: 'userAutocomplete'
					field: 'username'
					template: Template.userSearch
					noMatchTemplate: Template.userSearchEmpty
					matchAll: true
					filter:
						exceptions: Template.instance().selectedUsers.get()
					selector: (match) ->
						return { username: match }
					sort: 'username'
				}
			]
		}
	selectedUsers: ->
		return Template.instance().selectedUsers.get()

Template.mailMessagesInstructions.events
	'click .cancel': (e, t) ->
		t.reset()

	'click .send': (e, t) ->
		t.$('.error').hide()
		$btn = t.$('button.send')
		oldBtnValue = $btn.html()
		$btn.html(TAPi18n.__('Sending'))

		selectedMessages = $('.messages-box .message.selected')

		error = false
		if selectedMessages.length is 0
			t.$('.error-select').show()
			error = true

		if t.$('input[name=to_emails]').val().trim()
			rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/
			emails = t.$('input[name=to_emails]').val().trim().split(',')
			erroredEmails = []
			for email in emails
				unless rfcMailPatternWithName.test email.trim()
					erroredEmails.push email.trim()

			t.erroredEmails.set erroredEmails
			if erroredEmails.length > 0
				t.$('.error-invalid-emails').show()
				error = true
		else if not t.selectedUsers.get().length
			t.$('.error-missing-to').show()
			error = true

		if error
			$btn.html(oldBtnValue)
		else
			data =
				rid: Session.get('openedRoom')
				to_users: t.selectedUsers.get()
				to_emails: t.$('input[name=to_emails]').val().trim()
				subject: t.$('input[name=subject]').val().trim()
				messages: selectedMessages.map((i, message) -> return message.id).toArray()
				language: localStorage.getItem('userLanguage')

			Meteor.call 'mailMessages', data, (err, result) ->
				$btn.html(oldBtnValue)
				if err?
					return handleError(err)

				console.log(result)
				toastr.success(TAPi18n.__('Your_email_has_been_queued_for_sending'))
				t.reset()

	'click .select-all': (e, t) ->
		t.$('.error-select').hide()

		view = Blaze.getView($('.messages-box')[0])
		view?.templateInstance?().selectedMessages = _.pluck(ChatMessage.find({rid: Session.get('openedRoom')})?.fetch(), '_id')
		$(".messages-box .message").addClass('selected')

	'autocompleteselect #to_users': (event, instance, doc) ->
		instance.selectedUsers.set instance.selectedUsers.get().concat doc.username
		event.currentTarget.value = ''
		event.currentTarget.focus()

	'click .remove-to-user': (e, instance) ->
		self = @

		users = Template.instance().selectedUsers.get()
		users = _.reject Template.instance().selectedUsers.get(), (_id) ->
			return _id is self.valueOf()

		Template.instance().selectedUsers.set(users)

		$('#to_users').focus()

Template.mailMessagesInstructions.onCreated ->
	@autoCompleteCollection = new Mongo.Collection null
	@selectedUsers = new ReactiveVar []
	@erroredEmails = new ReactiveVar []

	@reset = =>
		@selectedUsers.set []
		RocketChat.TabBar.setTemplate('channelSettings')
		view = Blaze.getView($('.messages-box')[0])
		view?.templateInstance?().resetSelection?(false)

	@autorun =>
		if Session.get('channelSettingsMailMessages') isnt Session.get('openedRoom')
			this.reset()
