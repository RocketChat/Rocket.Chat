RocketChat.ChannelSettings = new class
	options = new ReactiveVar {}

	###
	# Adds an option in Channel Settings
	# @config (object)
	#   id: option id (required)
	#   template (string): template name to render (required)
	#   validation (function): if option should be displayed
	###
	addOption = (config) ->
		unless config?.id
			return false

		Tracker.nonreactive ->
			opts = options.get()
			opts[config.id] = config
			options.set opts

	getOptions = (currentData) ->
		allOptions = _.toArray options.get()
		allowedOptions = _.compact _.map allOptions, (option) ->
			if not option.validation? or option.validation()
				option.data = Object.assign (option.data or {}), currentData
				return option

		return _.sortBy allowedOptions, 'order'

	addOption: addOption
	getOptions: getOptions
