/* globals FileUpload */
import _ from 'underscore';

Meteor.startup(function() {
	WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function(req, res/*, next*/) {
		const params = {
			username: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''))
		};

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

			if (file) {
				res.setHeader('Content-Security-Policy', 'default-src \'none\'');

				return FileUpload.get(file, req, res);
			} else {
				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', 'public, max-age=0');
				res.setHeader('Expires', '-1');
				res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');

				const reqModifiedHeader = req.headers['if-modified-since'];

				if (reqModifiedHeader) {
					if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
						res.writeHead(304);
						res.end();
						return;
					}
				}

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
					color = RocketChat.getAvatarColor(username);

					initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 1).toUpperCase();
				}

				const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" pointer-events=\"none\" width=\"100%\" height=\"100%\">\n<rect height="100%" width="100%" fill=\"${ color }\"/>\n<text text-anchor=\"middle\" y=\"50%\" x=\"50%\" dy=\"0.36em\" pointer-events=\"auto\" fill=\"#ffffff\" font-family=\"Helvetica, Arial, Lucida Grande, sans-serif\" font-weight="400" font-size="80vw">\n${ initials }\n</text>\n</svg>`;

				res.write(svg);
				res.end();

				return;
			}
		}

		res.writeHead(404);
		res.end();
		return;
	}));
});
