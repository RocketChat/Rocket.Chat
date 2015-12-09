Template.integrationsIncoming.helpers

	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'

	data: ->
		params = Template.instance().data.params?()

		if params?.id?
			data = ChatIntegrations.findOne({_id: params.id})
			if data?
				data.url = Meteor.absoluteUrl("hooks/#{encodeURIComponent(data._id)}/#{encodeURIComponent(data.userId)}/#{encodeURIComponent(data.token)}")
				return data

		return {}


Template.integrationsIncoming.events
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
			Meteor.call "deleteIntegration", params.id, (err, data) ->
				swal
					title: t('Deleted')
					text: t('Your_entry_has_been_deleted')
					type: 'success'
					timer: 1000
					showConfirmButton: false

				FlowRouter.go "admin-integrations"

	"click .submit > .save": ->
		name = $('[name=name]').val().trim()
		channel = $('[name=channel]').val().trim()
		username = $('[name=username]').val().trim()

		if channel is ''
			return toastr.error TAPi18n.__("The_channel_name_is_required")

		if username is ''
			return toastr.error TAPi18n.__("The_username_is_required")

		integration =
			channel: channel
			name: name if name isnt ''

		params = Template.instance().data.params?()
		if params?.id?
			Meteor.call "updateIntegration", params.id, integration, (err, data) ->
				if err?
					return toastr.error TAPi18n.__(err.error)

				toastr.success TAPi18n.__("Integration_updated")
		else
			integration.type = 'webhook-incoming'
			integration.username = username

			Meteor.call "addIntegration", integration, (err, data) ->
				if err?
					return toastr.error TAPi18n.__(err.error)

				toastr.success TAPi18n.__("Integration_added")
				FlowRouter.go "admin-integrations-incoming", {id: data._id}
