Template.integrationsIncoming.onCreated ->
	@record = new ReactiveVar
		username: 'rocket.cat'


Template.integrationsIncoming.helpers

	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'

	data: ->
		params = Template.instance().data.params?()

		if params?.id?
			data = ChatIntegrations.findOne({_id: params.id})
			if data?
				data.url = Meteor.absoluteUrl("hooks/#{encodeURIComponent(data._id)}/#{encodeURIComponent(data.userId)}/#{encodeURIComponent(data.token)}")
				data.completeToken = "#{encodeURIComponent(data._id)}/#{encodeURIComponent(data.userId)}/#{encodeURIComponent(data.token)}"
				Template.instance().record.set data
				return data

		return Template.instance().record.curValue

	example: ->
		record = Template.instance().record.get()
		return {} =
			_id: Random.id()
			alias: record.alias
			emoji: record.emoji
			avatar: record.avatar
			msg: 'Example message'
			bot:
				i: Random.id()
			groupable: false
			attachments: [{
				title: "Rocket.Chat"
				title_link: "https://rocket.chat"
				text: "Rocket.Chat, the best open source chat"
				image_url: "https://rocket.chat/images/mockup.png"
				color: "#764FA5"
			}]
			ts: new Date
			u:
				_id: Random.id()
				username: record.username

	exampleJson: ->
		record = Template.instance().record.get()
		data =
			username: record.alias
			icon_emoji: record.emoji
			icon_url: record.avatar
			text: 'Example message'
			attachments: [{
				title: "Rocket.Chat"
				title_link: "https://rocket.chat"
				text: "Rocket.Chat, the best open source chat"
				image_url: "https://rocket.chat/images/mockup.png"
				color: "#764FA5"
			}]

		for key, value of data
			delete data[key] if value in [null, ""]

		return hljs.highlight('json', JSON.stringify(data, null, 2)).value

	curl: ->
		record = Template.instance().record.get()
		data =
			username: record.alias
			icon_emoji: record.emoji
			icon_url: record.avatar
			text: 'Example message'
			attachments: [{
				title: "Rocket.Chat"
				title_link: "https://rocket.chat"
				text: "Rocket.Chat, the best open source chat"
				image_url: "https://rocket.chat/images/mockup.png"
				color: "#764FA5"
			}]

		for key, value of data
			delete data[key] if value in [null, ""]

		return "curl -X POST --data-urlencode 'payload=#{JSON.stringify(data)}' #{record.url}"

Template.integrationsIncoming.events
	"blur input": (e, t) ->
		t.record.set
			name: $('[name=name]').val().trim()
			alias: $('[name=alias]').val().trim()
			emoji: $('[name=emoji]').val().trim()
			avatar: $('[name=avatar]').val().trim()
			channel: $('[name=channel]').val().trim()
			username: $('[name=username]').val().trim()

	"click .submit > .delete": ->
		params = Template.instance().data.params()

		swal
			title: t('Are_you_sure')
			text: t('You_will_not_be_able_to_recover')
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: t('Yes_delete_it')
			cancelButtonText: t('Cancel')
			closeOnConfirm: false
			html: false
		, ->
			Meteor.call "deleteIncomingIntegration", params.id, (err, data) ->
				swal
					title: t('Deleted')
					text: t('Your_entry_has_been_deleted')
					type: 'success'
					timer: 1000
					showConfirmButton: false

				FlowRouter.go "admin-integrations"

	"click .submit > .save": ->
		name = $('[name=name]').val().trim()
		alias = $('[name=alias]').val().trim()
		emoji = $('[name=emoji]').val().trim()
		avatar = $('[name=avatar]').val().trim()
		channel = $('[name=channel]').val().trim()
		username = $('[name=username]').val().trim()
		processIncomingRequestScript = $('[name=processIncomingRequestScript]').val().trim()

		if channel is ''
			return toastr.error TAPi18n.__("The_channel_name_is_required")

		if username is ''
			return toastr.error TAPi18n.__("The_username_is_required")

		integration =
			channel: channel
			alias: alias if alias isnt ''
			emoji: emoji if emoji isnt ''
			avatar: avatar if avatar isnt ''
			name: name if name isnt ''
			processIncomingRequestScript: processIncomingRequestScript if processIncomingRequestScript isnt ''

		params = Template.instance().data.params?()
		if params?.id?
			Meteor.call "updateIncomingIntegration", params.id, integration, (err, data) ->
				if err?
					return toastr.error TAPi18n.__(err.error)

				toastr.success TAPi18n.__("Integration_updated")
		else
			integration.username = username

			Meteor.call "addIncomingIntegration", integration, (err, data) ->
				if err?
					return toastr.error TAPi18n.__(err.error)

				toastr.success TAPi18n.__("Integration_added")
				FlowRouter.go "admin-integrations-incoming", {id: data._id}
