less = Npm.require('less')

getText = (file) ->
	Assets.getText file

getAndCompile = (cb) ->
	variables = """
		@content-background-color: #FFF;

		@primary-background-color: #04436A;
		@secondary-background-color: #F4F4F4;
		@tertiary-background-color: #EAEAEA;

		@primary-font-color: #444444;
		@secondary-font-color: #7F7F7F;
		@tertiary-font-color: rgba(255, 255, 255, 0.6);

		@input-font-color: rgba(255, 255, 255, 0.85);
		@link-font-color: #008CE3;

		@info-font-color: #AAAAAA;
		@info-active-font-color: #FF0000;

		@smallprint-font-color: #C2E7FF;
		@smallprint-hover-color: white;

		@status-online: #35AC19;
		@status-offline: rgba(150, 150, 150, 0.50);
		@status-busy: #D30230;
		@status-away: #FCB316;

		@code-background: #F8F8F8;
		@code-border: #CCC;
		@code-color: #333;
		@blockquote-background: #CCC;
	"""

	lesshat = Assets.getText 'assets/lesshat.import.less'
	colors = Assets.getText 'assets/colors.less'

	colors = [lesshat, variables, colors].join '\n'

	options =
		compress: true

	less.render colors, options, cb

WebApp.connectHandlers.use '/theme-colors.css', (req, res, next) ->
	getAndCompile (err, data) ->

		res.setHeader 'content-type', 'text/css; charset=UTF-8'
		res.setHeader 'Content-Disposition', 'inline'
		res.setHeader 'Cache-Control', 'no-cache'
		res.setHeader 'Pragma', 'no-cache'
		res.setHeader 'Expires', '0'
		res.setHeader 'Content-Length', data.css.length * 8

		res.end data.css
		# less.render colors
