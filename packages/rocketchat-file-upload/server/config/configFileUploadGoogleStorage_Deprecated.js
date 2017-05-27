/* globals FileUpload, Slingshot */

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

const createGoogleStorageDirective = _.debounce(() => {
	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');

	delete Slingshot._directives['rocketchat-uploads-gs'];

	if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
		createDirective('rocketchat-uploads-gs', {
			key: function _googleCloudStorageKey(file, metaContext) {
				const id = Random.id();
				const path = `${ RocketChat.settings.get('uniqueID') }/uploads/${ metaContext.rid }/${ this.userId }/${ id }`;

				const upload = {
					_id: id,
					rid: metaContext.rid,
					GoogleStorage: {
						path
					}
				};

				RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);

				return path;
			},
			bucket,
			accessId,
			secret
		});
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
