less = Npm.require('less')
crypto = Npm.require('crypto')

# program = WebApp.clientPrograms['web.browser']
# themeManifestItem = _.find program.manifest, (item) -> return item.url is '/theme.css'
# themeManifestItem.where = 'client'
# themeManifestItem.type = 'css'

ClientVersions = undefined
_defineMutationMethods = Meteor.Collection.prototype._defineMutationMethods
Meteor.Collection.prototype._defineMutationMethods = ->
	if this._name is 'meteor_autoupdate_clientVersions'
		ClientVersions = this

	_defineMutationMethods.call this

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
		'assets/stylesheets/utils/_octicons.less'
		'assets/stylesheets/utils/_chatops.less'
		'assets/stylesheets/animation.css'
		'assets/stylesheets/base.less'
		'assets/stylesheets/fontello.css'
		'assets/stylesheets/rtl.less'
		'assets/stylesheets/swipebox.min.css'
		'assets/stylesheets/utils/_colors.import.less'
	]

	constructor: ->
		RocketChat.settings.add 'css', ''
		RocketChat.settings.addGroup 'Theme'

		compile = _.debounce Meteor.bindEnvironment(@compile.bind(@)), 200

		RocketChat.settings.onload '*', Meteor.bindEnvironment (key, value, initialLoad) =>
			if /^theme-.+/.test(key) is false then return

			name = key.replace /^theme-[a-z]+-/, ''
			if @variables[name]?
				@variables[name].value = value

			compile()

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

			WebAppInternals.staticFiles['/__cordova/theme.css'] = WebAppInternals.staticFiles['/theme.css'] =
				cacheable: true
				sourceMapUrl: undefined
				type: 'css'
				content: data.css

			hash = crypto.createHash('sha1').update(data.css).digest('hex')

			program = WebApp.clientPrograms['web.cordova']
			themeManifestItem = _.find program.manifest, (item) -> return item.path is 'app/theme.css'
			themeManifestItem.type = 'css'
			themeManifestItem.where = 'client'
			themeManifestItem.url = "/theme.css?#{hash}"
			themeManifestItem.size = data.css.length
			themeManifestItem.hash = hash
			program.version = WebApp.calculateClientHashCordova()

			program = WebApp.clientPrograms['web.browser']
			themeManifestItem = _.find program.manifest, (item) -> return item.path is 'app/theme.css'
			themeManifestItem.type = 'css'
			themeManifestItem.where = 'client'
			themeManifestItem.url = "/theme.css?#{hash}"
			themeManifestItem.size = data.css.length
			themeManifestItem.hash = hash
			program.version = WebApp.calculateClientHashRefreshable()

			Autoupdate.autoupdateVersion            = __meteor_runtime_config__.autoupdateVersion            = process.env.AUTOUPDATE_VERSION or WebApp.calculateClientHashNonRefreshable()
			Autoupdate.autoupdateVersionRefreshable = __meteor_runtime_config__.autoupdateVersionRefreshable = process.env.AUTOUPDATE_VERSION or WebApp.calculateClientHashRefreshable()
			Autoupdate.autoupdateVersionCordova     = __meteor_runtime_config__.autoupdateVersionCordova     = process.env.AUTOUPDATE_VERSION or WebApp.calculateClientHashCordova()

			# reloadClientPrograms = WebAppInternals.reloadClientPrograms
			# WebAppInternals.reloadClientPrograms = ->

			WebAppInternals.generateBoilerplate()
			# process.emit('message', {refresh: 'client'})

			if not ClientVersions.findOne("version")?
				ClientVersions.insert
					_id: "version"
					version: Autoupdate.autoupdateVersion
			else
				ClientVersions.update "version",
					$set:
						version: Autoupdate.autoupdateVersion

			if not ClientVersions.findOne("version-cordova")?
				ClientVersions.insert
					_id: "version-cordova"
					version: Autoupdate.autoupdateVersionCordova
					refreshable: false
			else
				ClientVersions.update "version-cordova",
					$set:
						version: Autoupdate.autoupdateVersionCordova

			WebApp.onListening ->
				if not ClientVersions.findOne("version-refreshable")?
					ClientVersions.insert
						_id: "version-refreshable"
						version: Autoupdate.autoupdateVersionRefreshable
						assets: WebAppInternals.refreshableAssets
				else
					ClientVersions.update "version-refreshable",
						$set:
							version: Autoupdate.autoupdateVersionRefreshable
							assets: WebAppInternals.refreshableAssets

			# RocketChat.Notifications.notifyAll 'theme-updated'

	addVariable: (type, name, value, isPublic=true) ->
		@variables[name] =
			type: type
			value: value

		config =
			group: 'Theme'
			type: type
			section: type
			public: isPublic

		RocketChat.settings.add "theme-#{type}-#{name}", value, config

	addPublicColor: (name, value) ->
		@addVariable 'color', name, value, true

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


# WebApp.rawConnectHandlers.use '/theme.css', (req, res, next) ->
# 	css = RocketChat.theme.getCss()

# 	res.setHeader 'content-type', 'text/css; charset=UTF-8'
# 	res.setHeader 'Content-Disposition', 'inline'
# 	res.setHeader 'Cache-Control', 'no-cache'
# 	res.setHeader 'Pragma', 'no-cache'
# 	res.setHeader 'Expires', '0'

# 	res.end css
