/* globals FileUpload, UploadFS, RocketChatFile */
/* imports UploadFS, RocketChatFile */

Meteor.startup(function() {
	WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function(req, res/*, next*/) {
		const params = req.query;

		params.username = decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''));

		params.width = params.width && params.width > 0 ? (params.width <= 300 ? params.width : 300): 50;
		params.height = params.height && params.height > 0 ? (params.height <= 300 ? params.height : 300): 50;

		if (_.isEmpty(params.username)) {
			res.writeHead(403);
			res.write('Forbidden');
			res.end();
			return;
		}

		const match = /^\/([^?]*)/.exec(req.url);

		if (match[1]) {
			let username = decodeURIComponent(match[1]);
			let file;

			username = username.replace(/\.jpg$/, '');

			if (username[0] !== '@') {
				if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm) {
					const user = RocketChat.models.Users.findOneByUsername(username);
					if (user && user.services && user.services.sandstorm && user.services.sandstorm.picture) {
						res.setHeader('Location', user.services.sandstorm.picture);
						res.writeHead(302);
						res.end();
						return;
					}
				}
				file = RocketChat.models.Avatars.findOneByName(username);
			}

			res.setHeader('Cache-Control', 'public, max-age=0');
			res.setHeader('Expires', '-1');
			res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');

			if (file) {
				res.setHeader('Content-Security-Policy', 'default-src \'none\'');

				params.format = params.format || file.type.split('/')[1];

				if (params.width !== 50 || params.height !== 50 || params.format !== file.type.split('/')[1]) {
					const fileStore = UploadFS.getStore(file.store);

					RocketChatFile.gm(fileStore.getReadStream(file._id, file))
						.resize(params.width, params.height)
						.stream(params.format, function(error, stdout) {
							if (error) {
								throw error;
							}
							res.set('Content-Type', `image/${ params.format }`);
							stdout.pipe(res);
						});
					return;
				} else {
					return FileUpload.get(file, req, res);
				}
			} else {
				res.setHeader('Content-Type', 'image/svg+xml');

				const reqModifiedHeader = req.headers['if-modified-since'];

				if (reqModifiedHeader) {
					if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
						res.writeHead(304);
						res.end();
						return;
					}
				}

				const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722', '#795548', '#9E9E9E', '#607D8B'];

				if (RocketChat.settings.get('UI_Use_Name_Avatar')) {
					const user = RocketChat.models.Users.findOneByUsername(username, {
						fields: {
							name: 1
						}
					});

					if (user && user.name) {
						username = user.name;
					}
				}

				let color = '';
				let initials = '';

				if (username === '?') {
					color = '#000';
					initials = username;
				} else {
					const position = username.length % colors.length;

					color = colors[position];
					username = username.replace(/[^A-Za-z0-9]/g, '.').replace(/\.+/g, '.').replace(/(^\.)|(\.$)/g, '');

					const usernameParts = username.split('.');

					initials = usernameParts.length > 1 ? _.first(usernameParts)[0] + _.last(usernameParts)[0] : username.replace(/[^A-Za-z0-9]/g, '').substr(0, 2);
					initials = initials.toUpperCase();
				}

				const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" pointer-events=\"none\" width=\"${ params.width }\" height=\"${ params.height }\">\n<rect height="${ params.height }" width="${ params.width }" fill=\"${ color }\"/>\n<text y=\"50%\" x=\"50%\" pointer-events=\"auto\" fill=\"#ffffff\" font-family=\"Helvetica, Arial, Lucida Grande, sans-serif\" font-weight=\"400\" font-size=\"${ params.height*(66/100) }\">\n<tspan y=\"75%\" x=\"50%\" text-anchor=\"middle\">${ initials }</tspan>\n</text>\n</svg>`;

				if (params.format && (params.format === 'png' || params.format === 'jpg' || params.format === 'bmp')) {
					const svgBuffer = new Buffer(svg);
					const gm = require('gm');

					gm(svgBuffer)
						.resize(params.width, params.height)
						.stream(params.format, function(error, stdout) {
							if (error) {
								throw error;
							}
							res.set('Content-Type', `image/${ params.format }`);
							stdout.pipe(res);
						});
				} else if (params.format && params.format !== '') {
					res.writeHead(400);
					res.end();
				} else {
					res.write(svg);
					res.end();
				}
				return;
			}
		}

		res.writeHead(404);
		res.end();
	}));
});
