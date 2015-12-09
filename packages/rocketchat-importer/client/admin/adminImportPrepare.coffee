Template.adminImportPrepare.helpers
	isAdmin: ->
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin')
	importer: ->
		importerKey = FlowRouter.getParam('importer')
		importer = undefined
		_.each RocketChat.importTool.importers, (i, key) ->
			i.key = key
			if key == importerKey
				importer = i

		return importer
	isLoaded: ->
		return Template.instance().loaded.get()
	users: ->
		return Template.instance().users.get()
	channels: ->
		return Template.instance().channels.get()

Template.adminImportPrepare.events
	'change .import-file-input': (event, template) ->
		importer = @
		e = event.originalEvent or event
		files = e.target.files
		if not files or files.length is 0
			files = e.dataTransfer?.files or []

		for blob in files
			if not importer.fileTypeRegex.test blob.type
				toastr.error t('Invalid_Import_File_Type')#TODO: Make translateable
				return

			reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onloadend = ->
				Meteor.call 'prepareImport', importer.key, reader.result, blob.type, blob.name, (error, data) ->
					if error
						console.log 'Errored out preparing the import:', error
						toastr.error error.reason
						return

					template.users.set data.users
					template.channels.set data.channels
					template.loaded.set true
					console.log 'User and Channel data:', data

	'click .button.start': (event, template) ->
		btn = this
		$(btn).prop "disabled", true
		importer = @
		for user in template.users.get()
			user.doImport = $("[name=#{user.id}]").is(':checked')

		for channel in template.channels.get()
			channel.doImport = $("[name=#{channel.id}]").is(':checked')

		Meteor.call 'startImport', FlowRouter.getParam('importer'), { users: template.users.get(), channels: template.channels.get() }, (error, data) ->
			console.log 'startImport', arguments
			if error
				console.warn 'Error on starting the import:', error
				toastr.error error.reason
				return

	'click .button.restart': (event, template) ->
		Meteor.call 'restartImport', FlowRouter.getParam('importer'), (error, data) ->
			if error
				console.warn 'Error on restarting the import:', error
				toastr.error error.reason
				return

			template.users.set []
			template.channels.set []
			template.loaded.set false

	'click .button.uncheck-deleted-users': (event, template) ->
		for user in template.users.get() when user.deleted
			$("[name=#{user.id}]").attr('checked', false);

	'click .button.uncheck-archived-channels': (event, template) ->
				for channel in template.channels.get() when channel.is_archived
					$("[name=#{channel.id}]").attr('checked', false);


Template.adminImportPrepare.onCreated ->
	instance = @
	@loaded = new ReactiveVar false
	@users = new ReactiveVar []
	@channels = new ReactiveVar []

	Meteor.call 'getImportData', FlowRouter.getParam('importer'), (error, ready) ->
		if error
			console.warn 'Error on getting the import data:', error
			toastr.error error.reason
			return

		console.log 'getImportData', ready
		if ready?._id
			instance.users.set ready.users
			instance.channels.set ready.channels
			instance.loaded.set true
