/* globals FileUpload, Slingshot */

import crypto from 'crypto';
import { FileUploadClass } from '../lib/FileUpload';

function generateUrlParts({ file }) {
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');

	if (!file || !file.googleCloudStorage || _.isEmpty(accessId) || _.isEmpty(secret)) {
		return;
	}

	return {
		accessId: encodeURIComponent(accessId),
		secret,
		path: file.googleCloudStorage.path + file._id
	};
}

function generateGetURL({ file }) {
	const parts = generateUrlParts({ file });

	if (!parts) {
		return;
	}

	const expires = new Date().getTime() + 120000;
	const signature = crypto.createSign('RSA-SHA256').update(`GET\n\n\n${ expires }\n/${ file.googleCloudStorage.bucket }/${ parts.path }`).sign(parts.secret, 'base64');

	return `${ file.url }?GoogleAccessId=${ parts.accessId }&Expires=${ expires }&Signature=${ encodeURIComponent(signature) }`;
}

function generateDeleteUrl({ file }) {
	const parts = generateUrlParts({ file });

	if (!parts) {
		return;
	}

	const expires = new Date().getTime() + 5000;
	const signature = crypto.createSign('RSA-SHA256').update(`DELETE\n\n\n${ expires }\n/${ file.googleCloudStorage.bucket }/${ encodeURIComponent(parts.path) }`).sign(parts.secret, 'base64');

	return `https://${ file.googleCloudStorage.bucket }.storage.googleapis.com/${ encodeURIComponent(parts.path) }?GoogleAccessId=${ parts.accessId }&Expires=${ expires }&Signature=${ encodeURIComponent(signature) }`;
}

function createDirective(directiveName, { key, bucket, accessId, secret }) {
	if (Slingshot._directives[directiveName]) {
		delete Slingshot._directives[directiveName];
	}

	const config = {
		bucket,
		GoogleAccessId: accessId,
		GoogleSecretKey: secret,
		key
	};

	try {
		Slingshot.createDirective(directiveName, Slingshot.GoogleCloud, config);
	} catch (e) {
		console.error('Error configuring GoogleCloudStorage ->', e.message);
	}
}

const getFile = function(file, req, res) {
	const fileUrl = generateGetURL({ file });

	if (fileUrl) {
		res.setHeader('Location', fileUrl);
		res.writeHead(302);
	}
	res.end();
};

const deleteFile = function(file) {
	if (!file || !file.googleCloudStorage) {
		console.warn('Failed to delete a file which is uploaded to Google Cloud Storage, the file and googleCloudStorage properties are not defined.');
		return;
	}

	// RocketChat.models.Uploads.deleteFile(file._id);

	const url = generateDeleteUrl({ file });

	if (_.isEmpty(url)) {
		console.warn('Failed to delete a file which is uploaded to Google Cloud Storage, failed to generate a delete url.');
		return;
	}

	HTTP.call('DELETE', url);
};

// DEPRECATED: backwards compatibility (remove)
new FileUploadClass({
	name: 'googleCloudStorage',
	model: 'Uploads',

	get: getFile,
	delete: deleteFile
});

new FileUploadClass({
	name: 'GoogleCloudStorage:Uploads',

	get: getFile,
	delete: deleteFile
});

new FileUploadClass({
	name: 'GoogleCloudStorage:Avatars',

	get: getFile,
	delete: deleteFile
});

const createGoogleStorageDirective = _.debounce(() => {
	const directives = [
		{
			name: 'rocketchat-uploads-gs',
			key: function _googleCloudStorageKey(file, metaContext) {
				const path = `${ RocketChat.settings.get('uniqueID') }/${ metaContext.rid }/${ this.userId }/`;
				const upload = {
					rid: metaContext.rid,
					googleCloudStorage: {
						bucket: RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'),
						path
					}
				};
				const fileId = RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);

				return path + fileId;
			}
		},
		{
			name: 'rocketchat-avatars-gs',
			key(file/*, metaContext*/) {
				const path = `${ RocketChat.settings.get('uniqueID') }/avatars/`;

				const user = RocketChat.models.Users.findOneById(this.userId);

				const upload = {
					username: user && user.username,
					googleCloudStorage: {
						bucket: RocketChat.settings.get('FileUpload_GoogleStorage_Bucket'),
						path
					}
				};
				delete file.name;
				RocketChat.models.Avatars.insertAvatarFileInit(user.username, this.userId, 'GoogleCloudStorage:Avatars', file, upload);

				return path + user.username;
			}
		}
	];

	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');

	if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
		directives.forEach((conf) => {
			console.log('conf.name ->', conf.name);
			createDirective(conf.name, { key: conf.key, bucket, accessId, secret });
		});
	} else {
		directives.forEach((conf) => {
			if (Slingshot._directives[conf.name]) {
				delete Slingshot._directives[conf.name];
			}
		});
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_Bucket', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_AccessId', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_Secret', createGoogleStorageDirective);
