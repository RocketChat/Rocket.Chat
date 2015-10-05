RocketChat.settings.add 'css', ''

less = Npm.require('less')

getText = (file) ->
	Assets.getText file

getAndCompile = (cb) ->

	files = [
		variables.getAsLess()
		Assets.getText 'assets/stylesheets/global/_variables.less'
		Assets.getText 'assets/stylesheets/utils/_emojione.import.less'
		Assets.getText 'assets/stylesheets/utils/_fonts.import.less'
		Assets.getText 'assets/stylesheets/utils/_keyframes.import.less'
		Assets.getText 'assets/stylesheets/utils/_lesshat.import.less'
		Assets.getText 'assets/stylesheets/utils/_preloader.import.less'
		Assets.getText 'assets/stylesheets/utils/_reset.import.less'
		Assets.getText 'assets/stylesheets/animation.css'
		Assets.getText 'assets/stylesheets/base.less'
		Assets.getText 'assets/stylesheets/fontello.css'
		Assets.getText 'assets/stylesheets/rtl.less'
		Assets.getText 'assets/stylesheets/swipebox.min.css'
		Assets.getText 'assets/colors.less'
	]

	colors = files.join '\n'

	options =
		compress: true

	console.log 'start rendering'
	start = Date.now()
	less.render colors, options, (err, data) ->
		console.log 'stop rendering', Date.now() - start
		if err?
			return console.log err

		RocketChat.settings.updateById 'css', data.css


getAndCompile()


WebApp.connectHandlers.use '/theme-colors.css', (req, res, next) ->
	css = RocketChat.settings.get 'css'

	res.setHeader 'content-type', 'text/css; charset=UTF-8'
	res.setHeader 'Content-Disposition', 'inline'
	res.setHeader 'Cache-Control', 'no-cache'
	res.setHeader 'Pragma', 'no-cache'
	res.setHeader 'Expires', '0'
	res.setHeader 'Content-Length', css.length * 8

	res.end css
