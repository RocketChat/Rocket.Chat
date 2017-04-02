import toastr from 'toastr'
TempSettings = new Mongo.Collection null
RocketChat.TempSettings = TempSettings

getDefaultSetting = (settingId) ->
	return RocketChat.settings.collectionPrivate.findOne({_id: settingId})

setFieldValue = (settingId, value, type, editor) ->
	input = $('.page-settings').find('[name="' + settingId + '"]')

	switch type
		when 'boolean'
			$('.page-settings').find('[name="' + settingId + '"][value="' + Number(value) + '"]').prop('checked', true).change()
		when 'code'
			input.next()[0].CodeMirror.setValue(value)
		when 'color'
			input.parents('.horizontal').find('select[name="color-editor"]').val(editor).change()
			input.val(value).change()

			if editor is 'color'
				new jscolor(input)

		else
			input.val(value).change()

Template.admin.onCreated ->
	if not RocketChat.settings.cachedCollectionPrivate?
		RocketChat.settings.cachedCollectionPrivate = new RocketChat.CachedCollection({ name: 'private-settings', eventType: 'onLogged' })
		RocketChat.settings.collectionPrivate = RocketChat.settings.cachedCollectionPrivate.collection
		RocketChat.settings.cachedCollectionPrivate.init()

	this.selectedRooms = new ReactiveVar {}

	RocketChat.settings.collectionPrivate.find().observe
		added: (data) =>
			selectedRooms = this.selectedRooms.get()
			if data.type is 'roomPick'
				selectedRooms[data._id] = data.value
				this.selectedRooms.set(selectedRooms)
			TempSettings.insert data
		changed: (data) =>
			selectedRooms = this.selectedRooms.get()
			if data.type is 'roomPick'
				selectedRooms[data._id] = data.value
				this.selectedRooms.set(selectedRooms)
			TempSettings.update data._id, data
		removed: (data) =>
			selectedRooms = this.selectedRooms.get()
			if data.type is 'roomPick'
				delete selectedRooms[data._id]
				this.selectedRooms.set(selectedRooms)
			TempSettings.remove data._id

Template.admin.onDestroyed ->
	TempSettings.remove {}

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
		return (RocketChat.settings.get('Language'))?.split('-').shift().toLowerCase() is key

	group: ->
		groupId = FlowRouter.getParam('group')
		group = RocketChat.settings.collectionPrivate.findOne { _id: groupId, type: 'group' }

		if not group
			return

		settings = RocketChat.settings.collectionPrivate.find({ group: groupId }, {sort: {section: 1, sorter: 1, i18nLabel: 1}}).fetch()

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
					if RocketChat.settings.collectionPrivate.findOne(item)?
						setting.value = TAPi18n.__(setting._id + '_Default')

			sections[setting.section or ''] ?= []
			sections[setting.section or ''].push setting

		group.sections = []
		for key, value of sections
			group.sections.push
				section: key
				settings: value

		return group

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

	isSettingChanged: (id) ->
		return TempSettings.findOne({_id: id}, {fields: {changed: 1}}).changed

	translateSection: (section) ->
		if section.indexOf(':') > -1
			return section

		return t(section)

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
		return RocketChat.settings.collectionPrivate.findOne({_id: _id})?.value is val

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
			return if not $('.code-mirror-box[data-editor-id="'+_id+'"] .CodeMirror')[0]

			codeMirror = $('.code-mirror-box[data-editor-id="'+_id+'"] .CodeMirror')[0].CodeMirror
			if codeMirror.changeAdded is true
				return

			onChange = ->
				value = codeMirror.getValue()
				TempSettings.update {_id: _id},
					$set:
						value: value
						changed: RocketChat.settings.collectionPrivate.findOne(_id).value isnt value

			onChangeDelayed = _.debounce onChange, 500

			codeMirror.on 'change', onChangeDelayed
			codeMirror.changeAdded = true

		return

	assetAccept: (fileConstraints) ->
		if fileConstraints.extensions?.length > 0
			return '.' + fileConstraints.extensions.join(', .')

	autocompleteRoom: ->
		return {
			limit: 10
			# inputDelay: 300
			rules: [
				{
					# @TODO maybe change this 'collection' and/or template
					collection: 'CachedChannelList'
					subscription: 'channelAndPrivateAutocomplete'
					field: 'name'
					template: Template.roomSearch
					noMatchTemplate: Template.roomSearchEmpty
					matchAll: true
					selector: (match) ->
						return { name: match }
					sort: 'name'
				}
			]
		}

	selectedRooms: ->
		return Template.instance().selectedRooms.get()[this._id] or []

	getColorVariable: (color) ->
		return color.replace(/theme-color-/, '@')

	showResetButton: ->
		setting = TempSettings.findOne({ _id: @_id }, { fields: { value: 1, packageValue: 1 } })
		return @type isnt 'asset' and setting.value isnt setting.packageValue and not @blocked

Template.admin.events
	"change .input-monitor, keyup .input-monitor": _.throttle((e, t) ->
		value = _.trim $(e.target).val()

		switch @type
			when 'int'
				value = parseInt(value)
			when 'boolean'
				value = value is "1"

		TempSettings.update {_id: @_id},
			$set:
				value: value
				changed: RocketChat.settings.collectionPrivate.findOne(@_id).value isnt value
	, 500)

	"change select[name=color-editor]": (e, t) ->
		value = _.trim $(e.target).val()
		TempSettings.update {_id: @_id},
			$set:
				editor: value

	"click .submit .discard": ->
		group = FlowRouter.getParam('group')

		query =
			group: group
			changed: true

		settings = TempSettings.find(query, {fields: {_id: 1, value: 1, packageValue: 1}}).fetch()

		settings.forEach (setting) ->
			oldSetting = RocketChat.settings.collectionPrivate.findOne({_id: setting._id}, {fields: {value: 1, type:1, editor: 1}})

			setFieldValue(setting._id, oldSetting.value, oldSetting.type, oldSetting.editor)

	"click .reset-setting": (e, t) ->
		e.preventDefault();
		settingId = $(e.target).data('setting')
		if typeof settingId is 'undefined' then settingId = $(e.target).parent().data('setting')

		defaultValue = getDefaultSetting(settingId)

		setFieldValue(settingId, defaultValue.packageValue, defaultValue.type, defaultValue.editor)

	"click .reset-group": (e, t) ->
		e.preventDefault();
		group = FlowRouter.getParam('group')
		section = $(e.target).data('section')

		if section is ""
			settings = TempSettings.find({group: group, section: {$exists: false}}, {fields: {_id: 1}}).fetch()
		else
			settings = TempSettings.find({group: group, section: section}, {fields: {_id: 1}}).fetch()

		settings.forEach (setting) ->
			defaultValue = getDefaultSetting(setting._id)
			setFieldValue(setting._id, defaultValue.packageValue, defaultValue.type, defaultValue.editor)

			TempSettings.update {_id: setting._id},
			$set:
				value: defaultValue.packageValue
				changed: RocketChat.settings.collectionPrivate.findOne(setting._id).value isnt defaultValue.packageValue

	"click .submit .save": (e, t) ->
		group = FlowRouter.getParam('group')

		query =
			group: group
			changed: true

		settings = TempSettings.find(query, {fields: {_id: 1, value: 1, editor: 1}}).fetch()

		if not _.isEmpty settings
			RocketChat.settings.batchSet settings, (err, success) ->
				return handleError(err) if err
				TempSettings.update({changed: true}, {$unset: {changed: 1}})
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

	"click .submit .refresh-oauth": (e, t) ->
		toastr.info TAPi18n.__ 'Refreshing'
		Meteor.call 'refreshOAuthService', (err) ->
			if err
				handleError(err)
			else
				toastr.success TAPi18n.__ 'Done'

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
				err.details = _.extend(err.details || {}, errorTitle: 'Error')
				handleError(err)
				return

			args = [data.message].concat data.params

			toastr.success TAPi18n.__.apply(TAPi18n, args), TAPi18n.__('Success')

	"click .button-fullscreen": ->
		codeMirrorBox = $('.code-mirror-box[data-editor-id="'+this._id+'"]')
		codeMirrorBox.addClass('code-mirror-box-fullscreen content-background-color')
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh()

	"click .button-restore": ->
		codeMirrorBox = $('.code-mirror-box[data-editor-id="'+this._id+'"]')
		codeMirrorBox.removeClass('code-mirror-box-fullscreen content-background-color')
		codeMirrorBox.find('.CodeMirror')[0].CodeMirror.refresh()

	'autocompleteselect .autocomplete': (event, instance, doc) ->
		selectedRooms = instance.selectedRooms.get()
		selectedRooms[this.id] = (selectedRooms[this.id] || []).concat doc
		instance.selectedRooms.set selectedRooms
		value = selectedRooms[this.id]
		TempSettings.update {_id: this.id},
			$set:
				value: value
				changed: RocketChat.settings.collectionPrivate.findOne(this.id).value isnt value
		event.currentTarget.value = ''
		event.currentTarget.focus()

	'click .remove-room': (event, instance) ->
		docId = this._id
		settingId = event.currentTarget.getAttribute('data-setting')
		selectedRooms = instance.selectedRooms.get()
		selectedRooms[settingId] = _.reject(selectedRooms[settingId] || [], (setting) -> setting._id is docId)
		instance.selectedRooms.set selectedRooms
		value = selectedRooms[settingId]
		TempSettings.update {_id: settingId},
			$set:
				value: value
				changed: RocketChat.settings.collectionPrivate.findOne(settingId).value isnt value

Template.admin.onRendered ->
	Tracker.afterFlush ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

	Tracker.autorun ->
		hasColor = TempSettings.findOne { group: FlowRouter.getParam('group'), type: 'color' }, { fields: { _id: 1 } }
		if hasColor
			Meteor.setTimeout ->
				$('.colorpicker-input').each (index, el) ->
					new jscolor(el)
			, 400
