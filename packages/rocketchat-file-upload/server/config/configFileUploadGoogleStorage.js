/* globals FileUpload, Slingshot, SystemLogger */

const crypto = Npm.require('crypto');

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

FileUpload.addHandler('googleCloudStorage', {
	get(file, req, res) {
		const fileUrl = generateGetURL({ file });

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	},
	delete(file) {
		if (!file || !file.googleCloudStorage) {
			console.warn('Failed to delete a file which is uploaded to Google Cloud Storage, the file and googleCloudStorage properties are not defined.');
			return;
		}

		const url = generateDeleteUrl({ file });

		if (_.isEmpty(url)) {
			console.warn('Failed to delete a file which is uploaded to Google Cloud Storage, failed to generate a delete url.');
			return;
		}

		HTTP.call('DELETE', url);
	}
});

const createGoogleStorageDirective = _.debounce(() => {
	const directiveName = 'rocketchat-uploads-gs';

	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');

	if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
		if (Slingshot._directives[directiveName]) {
			delete Slingshot._directives[directiveName];
		}

		const config = {
			bucket,
			GoogleAccessId: accessId,
			GoogleSecretKey: secret,
			key: function _googleCloudStorageKey(file, metaContext) {
				const path = `${ RocketChat.settings.get('uniqueID') }/${ metaContext.rid }/${ this.userId }/`;
				const fileId = RocketChat.models.Uploads.insertFileInit(metaContext.rid, this.userId, 'googleCloudStorage', file, { googleCloudStorage: { bucket, path }});

				return path + fileId;
			}
		};

		try {
			Slingshot.createDirective(directiveName, Slingshot.GoogleCloud, config);
		} catch (e) {
			SystemLogger.error('Error configuring GoogleCloudStorage ->', e.message);
		}
	} else {
		delete Slingshot._directives[directiveName];
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_Bucket', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_AccessId', createGoogleStorageDirective);
RocketChat.settings.get('FileUpload_GoogleStorage_Secret', createGoogleStorageDirective);
