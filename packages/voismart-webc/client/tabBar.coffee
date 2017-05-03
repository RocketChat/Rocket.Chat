Meteor.startup ->
	Tracker.autorun ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is true
			RocketChat.TabBar.addButton({
				groups: ['channel', 'privategroup'],
				id: 'webcollaboration',
				i18nTitle: 'WebCollaboration',
				icon: 'icon-share',
				template: 'webCollaboration',
				order: 10
			})

			if Meteor.userId()
				RocketChat.Notifications.onUser 'webconf', (msg) ->
					msg.u =
						username: 'ConferenceBot'
					msg.private = true
					ChatMessage.upsert { _id: msg._id }, msg
		else
			RocketChat.TabBar.removeButton 'webcollaboration'

Template.webCollaboration.events
	'click #webc-audioconf': (e, t) ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is false
			return

		rnd = Math.floor((Math.random() * 10000) + 10000)
		nr = "*73*#{rnd}"
		rid = Session.get('openedRoom')
		msg = TAPi18n.__("New_AudioConference") + " " + nr
		Meteor.call 'phoneNumberOffer', rid, nr, msg, (error, result) ->
			if !error
				RocketChat.TabBar.closeFlex()

	'click #webc_tryme': (e, t) ->
		enabled = RocketChat.settings.get('Webc_Enabled')
		if enabled is false
			return

		Meteor.call 'webcRequest', Session.get('openedRoom'), (error, result) ->
			if not result?
				reason = "500"
				if error and error.reason
					reason = error.reason
				msg = {
					_id: Random.id()
					rid: Session.get('openedRoom')
					ts: new Date
					u: username: 'ConferenceBot'
					private: true
					msg: "Error in WebCollabRequest (" + reason + ")"
				}
				ChatMessage.upsert { _id: msg._id }, msg
			else
				RocketChat.TabBar.closeFlex()

Template.emailsAdd.onCreated ->
	Session.set('emailInputs', [])

Template.emailsAdd.events
	'click .add-btn-participant': (e, t) ->
		emailInputs = Session.get('emailInputs')
		emailInputs.push({emailId: Random.id()})
		Session.set('emailInputs', emailInputs)
		$("#invite_button").attr("disabled", true)

	'click .remove-btn-participants': (e, t) ->
		$("#invite_button").attr("disabled", true)
		Session.set('emailInputs', [])

	'click .add-btn-channel-participants': (e, t) ->
		Meteor.call 'webcGetEmails', Session.get('openedRoom'), (error, result) ->
			if not result?
				return
			else
				emailInputs = Session.get('emailInputs')
				for email in result
					emailInputs.push({emailId: Random.id(), value: email})
				Session.set('emailInputs', emailInputs)
				valid_email = _.all emailInputs, (x) -> x.value? && x.value != ''
				if valid_email
					$("#invite_button").removeAttr("disabled")
				else
					$("#invite_button").attr("disabled", true)


	'click .btn-invite-participants': (e, t) ->
		e.preventDefault();
		emails = (email.value for email in t.findAll(".email_input"))
		if emails.length < 1
			toastr.error TAPi18n.__('Add_one_participant')
			return
		start_date_time = t.find(".date_calendar").value
		m = moment(start_date_time, ["DD-MM-YYYY HH:mm"], true)
		start_ts = m.unix()
		duration = t.find(".date_duration").value
		duration_seconds = parseInt(duration, 10 ) * 60
		Meteor.call 'webcByEmailRequest', Session.get('openedRoom'), emails, start_ts, "#{duration_seconds}", RocketChat.settings.get('Webc_PhoneNumber'), (error, result) ->
			if not result?
				return
			else
				Session.set('emailInputs', [])
				RocketChat.TabBar.closeFlex()

Template.emailsAdd.onRendered ->
	$('#datetimepicker4').datetimepicker({
		format: 'DD-MM-YYYY HH:mm',
		locale: moment.locale(),
		toolbarPlacement: 'top',
		showTodayButton: true,
		showClose: true,
		defaultDate: moment()
		})

Template.emailsItem.onRendered ->
	$('input').jqBootstrapValidation()

Template.emailsItem.events
	'keyup input': (e, t) ->
		email_errors = t.$('input').jqBootstrapValidation("hasErrors")
		if email_errors
			$("#invite_button").attr("disabled", true)
		else
			$("#invite_button").removeAttr("disabled")

	'change input': (e, t) ->
		input = $(e.target)
		unique_id = input.attr('emailId')
		inputs = Session.get('emailInputs')
		index = -1
		for v, i in inputs
			if v.emailId == unique_id
				index = i

		email_errors = t.$('input').jqBootstrapValidation("hasErrors")
		if email_errors
			inputs[index].value = ""
			$("#invite_button").attr("disabled", true)
		else
			inputs[index].value = input.val()
			$("#invite_button").removeAttr("disabled")
		Session.set('emailInputs', inputs)

	'click .delete-btn': (e, t) ->
		inputs = Session.get('emailInputs')
		emailId = t.$('.input-group.emailsItem').attr('emailId')
		emailitems = _.reject inputs, (x) -> x.emailId == emailId
		if emailitems.length < 1
			$("#invite_button").attr("disabled", true)
			valid_email = false
		else
			valid_email = _.all emailitems, (x) -> x.value? && x.value != ''
		if valid_email
			$("#invite_button").removeAttr("disabled")
		else
			$("#invite_button").attr("disabled", true)
		Session.set('emailInputs', emailitems)

Template.emailsAdd.helpers
	emailInputs: ->
		return Session.get('emailInputs')

