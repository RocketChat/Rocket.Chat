Template.integrations.helpers
	hasPermission: ->
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations'])

	integrations: ->
		return ChatIntegrations.find()

	dateFormated: (date) ->
		return moment(date).format('L LT')

Template.integrations.events
	'change .upload-integration': (e) ->
		e = e.originalEvent or e
		files = e.target.files
		if not files or files.length is 0
			files = e.dataTransfer?.files or []

		if files.length isnt 1
			return

		reader = new FileReader()
		reader.readAsText(files[0])
		e.target.value = ''
		reader.onloadend = =>
			console.log(reader.result)
			app = {}
			try
				app = JSON.parse(reader.result);
			catch e
				console.log(e)
				return

			Meteor.call 'addApplication', app, (err, data) ->
				console.log arguments
			# 	if err?
			# 		handleError(err)
			# 		# toastr.error err.reason, TAPi18n.__ err.error
			# 		console.log err
			# 		return

			# 	toastr.success TAPi18n.__ 'File_uploaded'
