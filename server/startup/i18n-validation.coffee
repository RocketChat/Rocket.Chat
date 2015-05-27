flat = (obj, newObj = {}, path = '') ->
	for key, value of obj
		if _.isObject value
			flat value, newObj, key + '.'
		else
			newObj[path + key] = value

	return newObj


Meteor.startup ->
	l = {}
	errors = []

	for lang, value of TAPi18next.options.resStore
		l[lang] = flat value

	for lang, value of l
		for subLang, subValue of l when subLang isnt lang
			for key, translation of subValue
				if not value[key]?
					errors.push "#{lang}: no value found for key #{key} from #{subLang}"

	if errors.length > 0
		len = 0
		for error in errors
			if error.length > len
				len = error.length

		console.log s.rpad('', len + 4, '=').red
		for error in errors
			console.log "|".red, s.rpad("#{error}", len).red,  "|".red
		console.log s.rpad('', len + 4, '=').red
