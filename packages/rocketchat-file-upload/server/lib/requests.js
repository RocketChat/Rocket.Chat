/* globals FileUpload, WebApp */

WebApp.connectHandlers.use(`${ __meteor_runtime_config__.ROOT_URL_PATH_PREFIX }/file-upload/`,	function(req, res, next) {

	const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		const file = RocketChat.models.Uploads.findOneById(match[1]);

		if (file) {
			if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
				res.writeHead(403);
				return res.end();
			}

			res.setHeader('Content-Security-Policy', 'default-src \'none\'');
			return FileUpload.get(file, req, res, next);
		}
	}

	res.writeHead(404);
	res.end();
});
