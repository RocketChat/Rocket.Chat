less = Npm.require('less')
autoprefixer = Npm.require('less-plugin-autoprefix')
crypto = Npm.require('crypto')

logger = new Logger 'rocketchat:theme',
	methods:
		stop_rendering:
			type: 'info'


WebApp.rawConnectHandlers.use (req, res, next) ->
	path = req.url.split("?")[0]
	prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''
	if (path == "#{prefix}/__cordova/theme.css" || path == "#{prefix}/theme.css")
		css = RocketChat.theme.getCss()
		hash = crypto.createHash('sha1').update(css).digest('hex')
		res.setHeader('Content-Type', 'text/css; charset=UTF-8')
		res.setHeader('ETag', '"' + hash + '"')
		res.write(css)
		res.end()
	else
		next()

calculateClientHash = WebAppHashing.calculateClientHash
WebAppHashing.calculateClientHash = (manifest, includeFilter, runtimeConfigOverride) ->
	css = RocketChat.theme.getCss()

	if css.trim() isnt ''
		hash = crypto.createHash('sha1').update(css).digest('hex')

		themeManifestItem = _.find manifest, (item) -> return item.path is 'app/theme.css'
		if not themeManifestItem?
			themeManifestItem = {}
			manifest.push themeManifestItem

		themeManifestItem.path = 'app/theme.css'
		themeManifestItem.type = 'css'
		themeManifestItem.cacheable = true
		themeManifestItem.where = 'client'
		themeManifestItem.url = "/theme.css?#{hash}"
		themeManifestItem.size = css.length
		themeManifestItem.hash = hash

	calculateClientHash.call this, manifest, includeFilter, runtimeConfigOverride

RocketChat.theme = new class
	variables: {}
	packageCallbacks: []
	files: [
		'assets/stylesheets/global/_variables.less'
		'assets/stylesheets/utils/_keyframes.import.less'
		'assets/stylesheets/utils/_lesshat.import.less'
		'assets/stylesheets/utils/_preloader.import.less'
		'assets/stylesheets/utils/_reset.import.less'
		'assets/stylesheets/utils/_chatops.less'
		'assets/stylesheets/animation.css'
		'assets/stylesheets/base.less'
		'assets/stylesheets/fontello.css'
		'assets/stylesheets/rtl.less'
		'assets/stylesheets/swipebox.min.css'
		'assets/stylesheets/utils/_mixins.import.less'
		'assets/stylesheets/utils/_colors.import.less'
	]

	constructor: ->
		@customCSS = ''

		RocketChat.settings.add 'css', ''
		RocketChat.settings.addGroup 'Layout'

		RocketChat.settings.onload 'css', Meteor.bindEnvironment (key, value, initialLoad) =>
			if not initialLoad
				Meteor.startup ->
					process.emit('message', {refresh: 'client'})

		@compileDelayed = _.debounce Meteor.bindEnvironment(@compile.bind(@)), 100

		Meteor.startup =>
			RocketChat.settings.onAfterInitialLoad =>

				RocketChat.settings.get '*', Meteor.bindEnvironment (key, value, initialLoad) =>
					if key is 'theme-custom-css'
						if value?.trim() isnt ''
							@customCSS = value
					else if /^theme-.+/.test(key) is true
						name = key.replace /^theme-[a-z]+-/, ''
						if @variables[name]?
							@variables[name].value = value
					else
						return

					@compileDelayed()

	compile: ->
		content = [
			@getVariablesAsLess()
		]

		content.push Assets.getText file for file in @files

		for packageCallback in @packageCallbacks
			result = packageCallback()
			if _.isString result
				content.push result

		content.push @customCSS

		content = content.join '\n'

		options =
			compress: true
			plugins: [
				new autoprefixer()
			]

		start = Date.now()
		less.render content, options, (err, data) ->
			logger.stop_rendering Date.now() - start
			if err?
				return console.log err

			RocketChat.settings.updateById 'css', data.css

			Meteor.startup ->
				Meteor.setTimeout ->
					process.emit('message', {refresh: 'client'})
				, 200

	addVariable: (type, name, value, section, persist=true, editor, allowedTypes) ->
		@variables[name] =
			type: type
			value: value

		if persist is true
			config =
				group: 'Layout'
				type: type
				editor: editor or type
				section: section
				public: false
				allowedTypes: allowedTypes

			RocketChat.settings.add "theme-#{type}-#{name}", value, config

	addPublicColor: (name, value, section, editor='color') ->
		@addVariable 'color', name, value, section, true, editor, ['color', 'expression']

	addPublicFont: (name, value) ->
		@addVariable 'font', name, value, 'Fonts', true

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

	addPackageAsset: (cb) ->
		@packageCallbacks.push cb
		@compileDelayed()

	getCss: ->
		return RocketChat.settings.get('css') or ''
