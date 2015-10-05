less = Npm.require('less')

RocketChat.theme = new class
	variables: {}
	files: [
		'assets/stylesheets/global/_variables.less'
		'assets/stylesheets/utils/_emojione.import.less'
		'assets/stylesheets/utils/_fonts.import.less'
		'assets/stylesheets/utils/_keyframes.import.less'
		'assets/stylesheets/utils/_lesshat.import.less'
		'assets/stylesheets/utils/_preloader.import.less'
		'assets/stylesheets/utils/_reset.import.less'
		'assets/stylesheets/animation.css'
		'assets/stylesheets/base.less'
		'assets/stylesheets/fontello.css'
		'assets/stylesheets/rtl.less'
		'assets/stylesheets/swipebox.min.css'
		'assets/colors.less'
	]

	constructor: ->
		RocketChat.settings.add 'css', ''

	compile: ->
		content = [
			@getVariablesAsLess()
		]

		content.push Assets.getText file for file in @files

		content = content.join '\n'

		options =
			compress: true

		start = Date.now()
		less.render content, options, (err, data) ->
			console.log 'stop rendering', Date.now() - start
			if err?
				return console.log err

			RocketChat.settings.updateById 'css', data.css

	addColor: (name, value) ->
		@variables[name] =
			value: value
			type: "color"

	getVariablesAsObject: ->
		obj = {}
		for name, variable of @variables
			obj[name] = variable.value

		return obj

	getVariablesAsLess: ->
		items = []
		for name, variable of @variables
			items.push "@#{name}: #{variable.value};"

		return items.join '\n'

	getCss: ->
		return RocketChat.settings.get 'css'


WebApp.connectHandlers.use '/theme-colors.css', (req, res, next) ->
	css = RocketChat.theme.getCss()

	res.setHeader 'content-type', 'text/css; charset=UTF-8'
	res.setHeader 'Content-Disposition', 'inline'
	res.setHeader 'Cache-Control', 'no-cache'
	res.setHeader 'Pragma', 'no-cache'
	res.setHeader 'Expires', '0'
	res.setHeader 'Content-Length', css.length * 8

	res.end css
