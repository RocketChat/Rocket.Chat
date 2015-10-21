RegExp.escape = (s) ->
	return s.replace /[-\/\\^$*+?.()|[\]{}]/g, '\\$&'