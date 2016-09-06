Template.adminImportPrepare.helpers
	isAdmin: ->
		return RocketChat.authz.hasRole(Meteor.userId(), 'admin')
	importer: ->
		importerKey = FlowRouter.getParam('importer')
		importer = undefined
		_.each Importer.Importers, (i, key) ->
			i.key = key
			if key == importerKey
				importer = i

		return importer
	isLoaded: ->
		return Template.instance().loaded.get()
	isPreparing: ->
		return Template.instance().preparing.get()
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
			template.preparing.set true
			if not importer.fileTypeRegex.test blob.type
				toastr.error t('Invalid_Import_File_Type')
				template.preparing.set false
				return

			reader = new FileReader()
			reader.readAsDataURL(blob)
			reader.onloadend = ->
				Meteor.call 'prepareImport', importer.key, reader.result, blob.type, blob.name, (error, data) ->
					if error
						console.warn 'Errored out preparing the import:', error
						handleError(error)
						return

					if data.step
						console.warn 'Invalid file.'
						toastr.error t('Invalid_Export_File', importer.key)
						template.preparing.set false
						return

					template.users.set data.users
					template.channels.set data.channels
					template.loaded.set true
					template.preparing.set false

	'click .button.start': (event, template) ->
		btn = this
		$(btn).prop "disabled", true
		importer = @
		for user in template.users.get()
			user.do_import = $("[name=#{user.user_id}]").is(':checked')

		for channel in template.channels.get()
			channel.do_import = $("[name=#{channel.channel_id}]").is(':checked')

		Meteor.call 'startImport', FlowRouter.getParam('importer'), { users: template.users.get(), channels: template.channels.get() }, (error, data) ->
			if error
				console.warn 'Error on starting the import:', error
				return handleError(error)
			else
				FlowRouter.go '/admin/import/progress/' + FlowRouter.getParam('importer')

	'click .button.restart': (event, template) ->
		Meteor.call 'restartImport', FlowRouter.getParam('importer'), (error, data) ->
			if error
				console.warn 'Error while restarting the import:', error
				handleError(error)
				return

			template.users.set []
			template.channels.set []
			template.loaded.set false

	'click .button.uncheck-deleted-users': (event, template) ->
		for user in template.users.get() when user.is_deleted
			$("[name=#{user.user_id}]").attr('checked', false);

	'click .button.uncheck-archived-channels': (event, template) ->
		for channel in template.channels.get() when channel.is_archived
			$("[name=#{channel.channel_id}]").attr('checked', false);


Template.adminImportPrepare.onCreated ->
	instance = @
	@preparing = new ReactiveVar true
	@loaded = new ReactiveVar false
	@users = new ReactiveVar []
	@channels = new ReactiveVar []

	loadSelection = (progress) ->
		if progress?.step
			switch progress.step
				#When the import is running, take the user to the progress page
				when 'importer_importing_started', 'importer_importing_users', 'importer_importing_channels', 'importer_importing_messages', 'importer_finishing'
					FlowRouter.go '/admin/import/progress/' + FlowRouter.getParam('importer')
				# when the import is done, restart it (new instance)
				when 'importer_user_selection'
					Meteor.call 'getSelectionData', FlowRouter.getParam('importer'), (error, data) ->
						if error
							handleError error
						instance.users.set data.users
						instance.channels.set data.channels
						instance.loaded.set true
						instance.preparing.set false
				when 'importer_new'
					instance.preparing.set false
				else
					Meteor.call 'restartImport', FlowRouter.getParam('importer'), (error, progress) ->
						if error
							handleError(error)
						loadSelection(progress)
		else
			console.warn 'Invalid progress information.', progress

	# Load the initial progress to determine what we need to do
	Meteor.call 'getImportProgress', FlowRouter.getParam('importer'), (error, progress) ->
		if error
			console.warn 'Error while getting the import progress:', error
			handleError error
			return

		# if the progress isnt defined, that means there currently isn't an instance
		# of the importer, so we need to create it
		if progress is undefined
			Meteor.call 'setupImporter', FlowRouter.getParam('importer'), (err, data) ->
				if err
					handleError(err)
				instance.preparing.set false
				loadSelection(data)
		else
			# Otherwise, we might need to do something based upon the current step
			# of the import
			loadSelection(progress)
