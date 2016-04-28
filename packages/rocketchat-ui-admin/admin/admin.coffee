@TempSettings = new Meteor.Collection null
@Settings.find().observe
	added: (data) ->
		TempSettings.insert data
	changed: (data) ->
		TempSettings.update data._id, data
	removed: (data) ->
		TempSettings.remove data._id


Template.admin.helpers
	languages: ->
		languages = TAPi18n.getLanguages()
		result = []
		for key, language of languages
			result.push _.extend(language, { key: key })
		result = _.sortBy(result, 'key')
		result.unshift {
			"name": "Default",
			"en": "Default",
			"key": ""
		}
		return result;

	appLanguage: (key) ->
		if !key
			return !RocketChat.settings.get('Language')
		selected = (RocketChat.settings.get('Language'))?.split('-').shift().toLowerCase() is key
		return selected

	group: ->
		group = FlowRouter.getParam('group')
		group ?= TempSettings.findOne({ type: 'group' })?._id
		return TempSettings.findOne { _id: group, type: 'group' }

	sections: ->
		group = FlowRouter.getParam('group')
		group ?= TempSettings.findOne({ type: 'group' })?._id
		settings = TempSettings.find({ group: group }, {sort: {section: 1, sorter: 1, i18nLabel: 1}}).fetch()

		sections = {}
		for setting in settings
			if setting.i18nDefaultQuery?
				if _.isString(setting.i18nDefaultQuery)
					i18nDefaultQuery = JSON.parse(setting.i18nDefaultQuery)
				else
					i18nDefaultQuery = setting.i18nDefaultQuery

				if not _.isArray(i18nDefaultQuery)
					i18nDefaultQuery = [i18nDefaultQuery]

				found = 0
				for item in i18nDefaultQuery
					if TempSettings.findOne(item)?
						setting.value = TAPi18n.__(setting._id + '_Default')

			sections[setting.section or ''] ?= []
			sections[setting.section or ''].push setting

		sectionsArray = []
		for key, value of sections
			sectionsArray.push
				section: key
				settings: value

		return sectionsArray

	i18nDefaultValue: ->
		return TAPi18n.__(@_id + '_Default')

	isDisabled: ->
		if @blocked
			return { disabled: 'disabled' }

		if not @enableQuery?
			return {}

		if _.isString(@enableQuery)
			enableQuery = JSON.parse(@enableQuery)
		else
			enableQuery = @enableQuery

		if not _.isArray(enableQuery)
			enableQuery = [enableQuery]

		found = 0
		for item in enableQuery
			if TempSettings.findOne(item)?
				found++

		return if found is enableQuery.length then {} else {disabled: 'disabled'}

	isReadonly: ->
		if @readonly is true
			return { readonly: 'readonly' }

	hasChanges: (section) ->
		group = FlowRouter.getParam('group')

		query =
			group: group
			changed: true

		if section?
			if section is ''
				query.$or = [
					{section: ''}
					{section: {$exists: false}}
				]
			else
				query.section = section

		return TempSettings.find(query).count() > 0

	translateSection: (section) ->
		if section.indexOf(':') > -1
			return section

		return t(section)

	flexOpened: ->
		return 'opened' if RocketChat.TabBar.isFlexOpen()

	arrowPosition: ->
		console.log 'room.helpers arrowPosition' if window.rocketDebug
		return 'left' unless RocketChat.TabBar.isFlexOpen()

	label: ->
		label = @i18nLabel or @_id
		return TAPi18n.__ label if label

	description: ->
		description = TAPi18n.__ @i18nDescription if @i18nDescription
		if description? and description isnt @i18nDescription
			return description

	sectionIsCustomOAuth: (section) ->
		return /^Custom OAuth:\s.+/.test section

	callbackURL: (section) ->
		id = s.strRight(section, 'Custom OAuth: ').toLowerCase()
		return Meteor.absoluteUrl('_oauth/' + id)

	relativeUrl: (url) ->
		return Meteor.absoluteUrl(url)

	selectedOption: (_id, val) ->
		return RocketChat.settings.get(_id) is val

	random: ->
		return Random.id()

	getEditorOptions: (readOnly = false) ->
		return {} =
			lineNumbers: true
			mode: this.code or "javascript"
			gutters: [
				"CodeMirror-linenumbers"
				"CodeMirror-foldgutter"
			]
			foldGutter: true
			matchBrackets: true
			autoCloseBrackets: true
			matchTags: true,
			showTrailingSpace: true
			highlightSelectionMatches: true
			readOnly: readOnly

	setEditorOnBlur: (_id) ->
		Meteor.defer ->
			codeMirror = $('.code-mirror-box[data-editor-id="'+_id+'"] .CodeMirror')[0].CodeMirror
			if codeMirror.changeAdded is true
				return

			onChange = ->
				value = codeMirror.getValue()
				TempSettings.update {_id: _id},
					$set:
						value: value
						changed: Settings.findOne(_id).value isnt value

			onChangeDelayed = _.debounce onChange, 500

			codeMirror.on 'change', onChangeDelayed
			codeMirror.changeAdded = true

		return

	assetAccept: (fileConstraints) ->
		if fileConstraints.extensions?.length > 0
			return '.' + fileConstraints.extensions.join(', .')


Template.admin.events
	"change .input-monitor": (e, t) ->
		value = _.trim $(e.target).val()

		switch @type
			when 'int'
				value = parseInt(value)
			when 'boolean'
				value = value is "1"

		TempSettings.update {_id: @_id},
			$set:
				value: value
				changed: Settings.findOne(@_id).value isnt value

	"click .submit .save": (e, t) ->
		group = FlowRouter.getParam('group')

		query =
			group: group
			changed: true

		if @section is ''
			query.$or = [
				{section: ''}
				{section: {$exists: false}}
			]
		else
			query.section = @section

		settings = TempSettings.find(query, {fields: {_id: 1, value: 1}}).fetch()

		if not _.isEmpty settings
			RocketChat.settings.batchSet settings, (err, success) ->
				return handleError(err) if err
				toastr.success TAPi18n.__ 'Settings_updated'

	"click .submit .refresh-clients": (e, t) ->
		Meteor.call 'refreshClients', ->
			toastr.success TAPi18n.__ 'Clients_will_refresh_in_a_few_seconds'

	"click .submit .add-custom-oauth": (e, t) ->
		config =
			title: TAPi18n.__ 'Add_custom_oauth'
			text: TAPi18n.__ 'Give_a_unique_name_for_the_custom_oauth'
			type: "input",
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: TAPi18n.__ 'Custom_oauth_unique_name'

		swal config, (inputValue) ->
			if inputValue is false
				return false

			if inputValue is ""
				swal.showInputError TAPi18n.__ 'Name_cant_be_empty'
				return false

			Meteor.call 'addOAuthService', inputValue, (err) ->
				if err
					handleError(err)

	"click .submit .remove-custom-oauth": (e, t) ->
		name = this.section.replace('Custom OAuth: ', '')
		config =
			title: TAPi18n.__ 'Are_you_sure'
			type: "input",
			type: 'warning'
			showCancelButton: true
			confirmButtonColor: '#DD6B55'
			confirmButtonText: TAPi18n.__ 'Yes_delete_it'
			cancelButtonText: TAPi18n.__ 'Cancel'
			closeOnConfirm: true

		swal config, ->
			Meteor.call 'removeOAuthService', name

	"click .delete-asset": ->
		Meteor.call 'unsetAsset', @asset

	"change input[type=file]": (ev) ->
		e = ev.originalEvent or ev
		files = e.target.files
		if not files or files.length is 0
			files = e.dataTransfer?.files or []

		for blob in files
			toastr.info TAPi18n.__ 'Uploading_file'

			# if @fileConstraints.contentType isnt blob.type
			# 	toastr.error blob.type, TAPi18n.__ 'Invalid_file_type'
			# 	return

			reader = new FileReader()
			reader.readAsBinaryString(blob)
			reader.onloadend = =>
				Meteor.call 'setAsset', reader.result, blob.type, @asset, (err, data) ->
					if err?
						handleError(err)
						# toastr.error err.reason, TAPi18n.__ err.error
						console.log err
						return

					toastr.success TAPi18n.__ 'File_uploaded'

	"click .expand": (e) ->
		$(e.currentTarget).closest('.section').removeClass('section-collapsed')
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__ "Collapse")
		$('.CodeMirror').each (index, codeMirror) ->
			codeMirror.CodeMirror.refresh()

	"click .collapse": (e) ->
		$(e.currentTarget).closest('.section').addClass('section-collapsed')
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__ "Expand")

	"click button.action": (e) ->
		if @type isnt 'action'
			return

		Meteor.call @value, (err, data) ->
			if err?
				err.details = _.extend(error.details || {}, errorTitle: 'Error')
				handleError(err)
				return

			args = [data.message].concat data.params

			toastr.success TAPi18n.__.apply(TAPi18n, args), TAPi18n.__('Success')

	"click .button-fullscreen": ->
		codeMirrorBox = $('.code-mirror-box[data-editor-id="'+this._id+'"]')
		codeMirrorBox.addClass('code-mirror-box-fullscreen')
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh()

	"click .button-restore": ->
		codeMirrorBox = $('.code-mirror-box[data-editor-id="'+this._id+'"]')
		codeMirrorBox.removeClass('code-mirror-box-fullscreen')
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh()


Template.admin.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

	Meteor.setTimeout ->
		$('input.minicolors').minicolors({theme: 'rocketchat'})
	, 1000

	Tracker.autorun ->
		FlowRouter.watchPathChange()
		Meteor.setTimeout ->
			$('input.minicolors').minicolors({theme: 'rocketchat'})
		, 400
