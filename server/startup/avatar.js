import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import sharp from 'sharp';
import { Cookies } from 'meteor/ostrio:cookies';
import { FileUpload } from 'meteor/rocketchat:file-upload';
import { getAvatarColor } from 'meteor/rocketchat:utils';
import { Users, Avatars } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';

const cookie = new Cookies();

function isUserAuthenticated(req) {
	const headers = req.headers || {};
	const query = req.query || {};

	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie) ;
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	if (!rc_uid || !rc_token || !Users.findOneByIdAndLoginToken(rc_uid, rc_token)) {
		return false;
	}

	return true;
}

const warnUnauthenticatedAccess = _.debounce(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

function userCanAccessAvatar(req) {
	if (settings.get('Accounts_AvatarBlockUnauthenticatedAccess') === true) {
		return isUserAuthenticated(req);
	}

	if (!isUserAuthenticated(req)) {
		warnUnauthenticatedAccess();
	}

	return true;
}

Meteor.startup(function() {
	WebApp.connectHandlers.use('/avatar/', Meteor.bindEnvironment(function(req, res/* , next*/) {
		const params = {
			username: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')),
		};
		const cacheTime = req.query.cacheTime || settings.get('Accounts_AvatarCacheTime');

		if (_.isEmpty(params.username) || !userCanAccessAvatar(req)) {
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
					const user = Users.findOneByUsername(username);
					if (user && user.services && user.services.sandstorm && user.services.sandstorm.picture) {
						res.setHeader('Location', user.services.sandstorm.picture);
						res.writeHead(302);
						res.end();
						return;
					}
				}
				file = Avatars.findOneByName(username);
			}

			if (file) {
				res.setHeader('Content-Security-Policy', 'default-src \'none\'');

				const reqModifiedHeader = req.headers['if-modified-since'];
				if (reqModifiedHeader && reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
					res.setHeader('Last-Modified', reqModifiedHeader);
					res.writeHead(304);
					res.end();
					return;
				}

				res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);
				res.setHeader('Expires', '-1');
				res.setHeader('Content-Disposition', 'inline');
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				return FileUpload.get(file, req, res);
			} else {
				res.setHeader('Content-Type', 'image/svg+xml');
				res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);
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

				if (settings.get('UI_Use_Name_Avatar')) {
					const user = Users.findOneByUsername(username, {
						fields: {
							name: 1,
						},
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
					color = getAvatarColor(username);

					initials = username.replace(/[^A-Za-z0-9]/g, '').substr(0, 1).toUpperCase();
				}

				const viewSize = parseInt(req.query.size) || 200;
				const fontSize = viewSize / 1.6;

				const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ${ viewSize } ${ viewSize }\">\n<rect width=\"100%\" height=\"100%\" fill=\"${ color }\"/>\n<text x=\"50%\" y=\"50%\" dy=\"0.36em\" text-anchor=\"middle\" pointer-events=\"none\" fill=\"#ffffff\" font-family=\"Helvetica, Arial, Lucida Grande, sans-serif\" font-size="${ fontSize }">\n${ initials }\n</text>\n</svg>`;

				if (['png', 'jpg', 'jpeg'].includes(req.query.format)) {
					res.setHeader('Content-Type', `image/${ req.query.format }`);
					sharp(new Buffer(svg))
						.toFormat(req.query.format)
						.pipe(res);
					return;
				}

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
