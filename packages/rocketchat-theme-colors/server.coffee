

less = Npm.require('less')

getText = (file) ->
	Assets.getText file

getAndCompile = (cb) ->

	# lesshat = Assets.getText 'assets/lesshat.import.less'
	# colors = Assets.getText 'assets/colors.less'

	files = [
		variables.getAsLess()
		Assets.getText 'assets/stylesheets/global/_variables.less'
		# Assets.getText 'assets/stylesheets/utils/_colors.import.less'
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

		# variables
		Assets.getText 'assets/colors.less'
	]

	# colors = [lesshat, variables, colors].join '\n'
	colors = files.join '\n'

	options =
		compress: true

	less.render colors, options, cb

WebApp.connectHandlers.use '/theme-colors.css', (req, res, next) ->
	console.log 'start rendering'
	start = Date.now()
	getAndCompile (err, data) ->
		console.log 'stop rendering', Date.now() - start, err
		res.setHeader 'content-type', 'text/css; charset=UTF-8'
		res.setHeader 'Content-Disposition', 'inline'
		res.setHeader 'Cache-Control', 'no-cache'
		res.setHeader 'Pragma', 'no-cache'
		res.setHeader 'Expires', '0'
		res.setHeader 'Content-Length', data.css.length * 8

		res.end data.css
