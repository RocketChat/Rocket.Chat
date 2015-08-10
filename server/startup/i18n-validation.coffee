flat = (obj, newObj = {}, path = '') ->
	for key, value of obj
		if _.isObject value
			flat value, newObj, key + '.'
		else
			newObj[path + key] = value

	return newObj


Meteor.startup ->
	return
	l = {}
	keys = {}
	errors = []

	langs = Object.keys TAPi18next.options.resStore
	for lang, value of TAPi18next.options.resStore
		l[lang] = flat value
		for key, value of l[lang]
			keys[key] ?= []
			keys[key].push lang

	len = 0
	for key, present of keys when present.length isnt langs.length
		error = "#{_.difference(langs, present).join(',')}: missing translation for ".red + key.white + ". Present in [#{present.join(',')}]".red
		errors.push error
		if error.length > len
			len = error.length

	if errors.length > 0
		console.log "+".red + s.rpad('', len - 28, '-').red + "+".red
		for error in errors
			console.log "|".red, s.rpad("#{error}", len).red,  "|".red
		console.log "+".red + s.rpad('', len - 28, '-').red + "+".red