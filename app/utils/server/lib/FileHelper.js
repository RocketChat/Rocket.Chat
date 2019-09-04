import { jws } from 'jsrsasign';

import { Uploads } from '../../../models/server';
import { settings } from '../../../settings/server';

const HEADER = {
	typ: 'JWT',
	alg: 'HS256',
};

const generateJsonWebToken = (message) => {
	const payload = {
		iat: jws.IntDate.get('now'),
		nbf: jws.IntDate.get('now'),
		exp: jws.IntDate.get('now + 1hour'),
		aud: 'RocketChat.Livechat',
		context: {
			rid: message.rid,
			userId: message.u._id,
			fileId: message.file._id,
		},
	};

	const header = JSON.stringify(HEADER);

	return jws.JWS.sign(HEADER.alg, header, JSON.stringify(payload), { rstr: settings.get('Livechat_json_web_token_secret_for_files') });
};

export const addJWTToFileUrlIfNecessary = (message) => {
	const upload = Uploads.findOneById(message.file._id);
	const needAppendJWT = ['Webdav:Uploads', 'FileSystem:Uploads', 'GridFS:Uploads'];

	if (upload && !needAppendJWT.includes(upload.store)) {
		return message;
	}
	const jwt = generateJsonWebToken(message);
	if (message.attachments && Array.isArray(message.attachments) && message.attachments.length) {
		message.attachments.forEach((attachment) => {
			if (attachment.title_link) {
				attachment.title_link = `${ attachment.title_link }?jwt=${ jwt }`;
			}
			if (attachment.image_url) {
				attachment.image_url = `${ attachment.image_url }?jwt=${ jwt }`;
			}
		});
	}

	return message;
};

export const isValidJWT = (jwt) => {
	try {
		return jws.JWS.verify(jwt, settings.get('Livechat_json_web_token_secret_for_files'), HEADER);
	} catch (error) {
		return false;
	}
};
