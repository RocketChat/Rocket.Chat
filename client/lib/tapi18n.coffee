@t = (key, replaces...) ->
	return TAPi18n.__ key, { postProcess: 'sprintf', sprintf: replaces }
