import moment from 'moment'
Flatpickr = require('./flatpickr-bridge.js').Flatpickr

email_re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

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

Template.webCollaboration.onCreated ->
	this.tabBar = Template.currentData().tabBar

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
				t.tabBar.close()

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
				t.tabBar.close()

Template.emailsAdd.onCreated ->
	Session.set('emailInputs', [])

Template.emailsAdd.onCreated ->
	this.tabBar = Template.currentData().tabBar

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
		start_date_time = t.find("#webc_date_time").value
		m = moment(start_date_time, ["DD-MM-YYYY HH:mm"], true)
		start_ts = m.unix()
		duration = t.find("#webc_duration").value
		duration_seconds = parseInt(duration, 10 ) * 60
		Meteor.call 'webcByEmailRequest', Session.get('openedRoom'), emails, start_ts, "#{duration_seconds}", RocketChat.settings.get('Webc_PhoneNumber'), (error, result) =>
			if not result?
				reason = "500"
				if error and error.reason
					reason = error.reason
				msg = "Error in WebCollabRequest (" + reason + ")"
				toastr.error msg
			if result and result.success?
				msg = "Error in WebCollabRequest (" + result.msg + ")"
				toastr.error msg
			else
				$("#invite_button").attr("disabled", true)
				Session.set('emailInputs', [])
				t.tabBar.close()

Template.emailsAdd.onRendered ->
	opts = {
		enableTime: true,
		altInput: true,
		dateFormat: 'd-m-Y H:i',
		defaultDate: moment().format('DD-MM-YYYY HH:mm'),
		time_24hr: true,
		locale: Flatpickr.l10ns[moment.locale()],
		plugins: [new Flatpickr.plugins.confirmDatePlugin({})]
	}

	$('#webc_date_time').flatpickr(opts)

Template.emailsItem.events
	'keyup input': (e, t) ->
		input = $(e.target)
		if !email_re.test(input.val())
			input.attr('aria-invalid', true)
			$("#invite_button").attr("disabled", true)
		else
			input.attr('aria-invalid', false)
			$("#invite_button").removeAttr("disabled")

	'change input': (e, t) ->
		input = $(e.target)
		unique_id = input.attr('emailId')
		inputs = Session.get('emailInputs')

		if !email_re.test(input.val())
			input.attr('aria-invalid', true)
			$("#invite_button").attr("disabled", true)
			for v, i in inputs
				if v.emailId == unique_id
					inputs[i].value = ""
					break
		else
			input.attr('aria-invalid', false)
			$("#invite_button").removeAttr("disabled")
			for v, i in inputs
				if v.emailId == unique_id
					inputs[i].value = input.val()
					break

		Session.set('emailInputs', inputs)

	'click .delete-btn': (e, t) ->
		inputs = Session.get('emailInputs')
		emailId = t.$('.webc-email-form').attr('emailId')
		emailitems = _.reject inputs, (x) -> x.emailId == emailId

		if emailitems.length < 1
			$("#invite_button").attr("disabled", true)
			valid_email = false
		else
			valid_email = _.all emailitems, (x) -> email_re.test(x.value)

		if valid_email
			$("#invite_button").removeAttr("disabled")
		else
			$("#invite_button").attr("disabled", true)

		Session.set('emailInputs', emailitems)

Template.emailsAdd.helpers
	emailInputs: ->
		return Session.get('emailInputs')

