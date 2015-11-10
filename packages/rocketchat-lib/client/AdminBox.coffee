RocketChat.AdminBox = new class
	options = new ReactiveVar []

	addOption = (option) ->
		Tracker.nonreactive ->
			actual = options.get()
			actual.push option
			options.set actual

	getOptions = ->
		return _.filter options.get(), (option) ->
			if not option.permissionGranted? or option.permissionGranted()
				return true

	addOption: addOption
	getOptions: getOptions
