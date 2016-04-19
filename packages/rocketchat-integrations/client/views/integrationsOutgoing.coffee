Template.integrationsOutgoing.onCreated ->
	@record = new ReactiveVar
		username: 'rocket.cat'
		token: Random.id(24)


Template.integrationsOutgoing.helpers

	join: (arr, sep) ->
		if not arr?.join?
			return arr

		return arr.join sep

	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'

	data: ->
		params = Template.instance().data.params?()

		if params?.id?
			data = ChatIntegrations.findOne({_id: params.id})
			if data?
				if not data.token?
					data.token = Random.id(24)
				return data

		return Template.instance().record.curValue

	example: ->
		record = Template.instance().record.get()
		return {} =
			_id: Random.id()
			alias: record.alias
			emoji: record.emoji
			avatar: record.avatar
			msg: 'Response text'
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
			text: 'Response text'
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

	editorOptions: ->
		return {} =
			lineNumbers: true
			mode: "javascript"
			gutters: [
				# "CodeMirror-lint-markers"
				"CodeMirror-linenumbers"
				"CodeMirror-foldgutter"
			]
			# lint: true
			foldGutter: true
			# lineWrapping: true
			matchBrackets: true
			autoCloseBrackets: true
			matchTags: true,
			showTrailingSpace: true
			highlightSelectionMatches: true


Template.integrationsOutgoing.events
	"blur input": (e, t) ->
		t.record.set
			name: $('[name=name]').val().trim()
			alias: $('[name=alias]').val().trim()
			emoji: $('[name=emoji]').val().trim()
			avatar: $('[name=avatar]').val().trim()
			channel: $('[name=channel]').val().trim()
			username: $('[name=username]').val().trim()
			triggerWords: $('[name=triggerWords]').val().trim()
			urls: $('[name=urls]').val().trim()
			token: $('[name=token]').val().trim()


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
			Meteor.call "deleteOutgoingIntegration", params.id, (err, data) ->
				if err
					handleError(err)
				else
					swal
						title: t('Deleted')
						text: t('Your_entry_has_been_deleted')
						type: 'success'
						timer: 1000
						showConfirmButton: false

					FlowRouter.go "admin-integrations"

	"click .button-fullscreen": ->
		$('.code-mirror-box').addClass('code-mirror-box-fullscreen');
		$('.CodeMirror')[0].CodeMirror.refresh()

	"click .button-restore": ->
		$('.code-mirror-box').removeClass('code-mirror-box-fullscreen');
		$('.CodeMirror')[0].CodeMirror.refresh()

	"click .submit > .save": ->
		enabled = $('[name=enabled]:checked').val().trim()
		name = $('[name=name]').val().trim()
		alias = $('[name=alias]').val().trim()
		emoji = $('[name=emoji]').val().trim()
		avatar = $('[name=avatar]').val().trim()
		channel = $('[name=channel]').val().trim()
		username = $('[name=username]').val().trim()
		triggerWords = $('[name=triggerWords]').val().trim()
		urls = $('[name=urls]').val().trim()
		token = $('[name=token]').val().trim()
		scriptEnabled = $('[name=scriptEnabled]:checked').val().trim()
		script = $('[name=script]').val().trim()

		if username is ''
			return toastr.error TAPi18n.__("The_username_is_required")

		triggerWords = triggerWords.split(',')
		for triggerWord, index in triggerWords
			triggerWords[index] = triggerWord.trim()
			delete triggerWords[index] if triggerWord.trim() is ''

		triggerWords = _.without triggerWords, [undefined]

		urls = urls.split('\n')
		for url, index in urls
			urls[index] = url.trim()
			delete urls[index] if url.trim() is ''

		urls = _.without urls, [undefined]

		if urls.length is 0
			return toastr.error TAPi18n.__("You_should_inform_one_url_at_least")

		integration =
			enabled: enabled is '1'
			username: username
			channel: channel if channel isnt ''
			alias: alias if alias isnt ''
			emoji: emoji if emoji isnt ''
			avatar: avatar if avatar isnt ''
			name: name if name isnt ''
			triggerWords: triggerWords if triggerWords isnt ''
			urls: urls if urls isnt ''
			token: token if token isnt ''
			script: script if script isnt ''
			scriptEnabled: scriptEnabled is '1'

		params = Template.instance().data.params?()
		if params?.id?
			Meteor.call "updateOutgoingIntegration", params.id, integration, (err, data) ->
				if err?
					return handleError err

				toastr.success TAPi18n.__("Integration_updated")
		else
			Meteor.call "addOutgoingIntegration", integration, (err, data) ->
				if err?
					return handleError(err)

				toastr.success TAPi18n.__("Integration_added")
				FlowRouter.go "admin-integrations-outgoing", {id: data._id}
