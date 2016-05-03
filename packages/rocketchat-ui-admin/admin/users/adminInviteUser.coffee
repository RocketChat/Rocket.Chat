Template.adminInviteUser.helpers
	isAdmin: ->
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin')
	inviteEmails: ->
		return Template.instance().inviteEmails.get()

Template.adminInviteUser.events
	'click .send': (e, instance) ->
		emails = $('#inviteEmails').val().split /[\s,;]/
		rfcMailPattern = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
		validEmails = _.compact _.map emails, (email) -> return email if rfcMailPattern.test email
		if validEmails.length
			Meteor.call 'sendInvitationEmail', validEmails, (error, result) ->
				if result
					instance.clearForm()
					instance.inviteEmails.set validEmails
				if error
					handleError(error)
		else
			toastr.error t('Send_invitation_email_error')

	'click .cancel': (e, instance) ->
		instance.clearForm()
		instance.inviteEmails.set []
		RocketChat.TabBar.closeFlex()

Template.adminInviteUser.onCreated ->
	@inviteEmails = new ReactiveVar []
	@clearForm = ->
		$('#inviteEmails').val('')
