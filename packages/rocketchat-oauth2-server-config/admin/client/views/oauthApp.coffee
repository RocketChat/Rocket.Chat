Template.oauthApp.onCreated ->
	@record = new ReactiveVar
		active: true


Template.oauthApp.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-oauth-apps'

	data: ->
		params = Template.instance().data.params?()

		if params?.id?
			data = ChatOAuthApps.findOne({_id: params.id})
			if data?
				data.authorization_url = Meteor.absoluteUrl("oauth/authorize")
				data.access_token_url = Meteor.absoluteUrl("oauth/token")

				Template.instance().record.set data
				return data

		return Template.instance().record.curValue


Template.oauthApp.events
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
			Meteor.call "deleteOAuthApp", params.id, (err, data) ->
				swal
					title: t('Deleted')
					text: t('Your_entry_has_been_deleted')
					type: 'success'
					timer: 1000
					showConfirmButton: false

				FlowRouter.go "admin-oauth-apps"

	"click .submit > .save": ->
		name = $('[name=name]').val().trim()
		active = $('[name=active]:checked').val().trim() is "1"
		redirectUri = $('[name=redirectUri]').val().trim()

		if name is ''
			return toastr.error TAPi18n.__("The_application_name_is_required")

		if redirectUri is ''
			return toastr.error TAPi18n.__("The_redirectUri_is_required")

		app =
			name: name
			active: active
			redirectUri: redirectUri

		params = Template.instance().data.params?()
		if params?.id?
			Meteor.call "updateOAuthApp", params.id, app, (err, data) ->
				if err?
					return handleError(err)

				toastr.success TAPi18n.__("Application_updated")
		else
			Meteor.call "addOAuthApp", app, (err, data) ->
				if err?
					return handleError(err)

				toastr.success TAPi18n.__("Application_added")
				FlowRouter.go "admin-oauth-app", {id: data._id}
