/* globals Slingshot, FileUpload */
import _ from 'underscore';

const configureSlingshot = _.debounce(() => {
	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	const acl = RocketChat.settings.get('FileUpload_S3_Acl');
	const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
	const region = RocketChat.settings.get('FileUpload_S3_Region');
	const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');

	delete Slingshot._directives['rocketchat-uploads'];

	if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
		if (Slingshot._directives['rocketchat-uploads']) {
			delete Slingshot._directives['rocketchat-uploads'];
		}
		const config = {
			bucket,
			key(file, metaContext) {
				const id = Random.id();
				const path = `${ RocketChat.settings.get('uniqueID') }/uploads/${ metaContext.rid }/${ this.userId }/${ id }`;

				const upload = {
					_id: id,
					rid: metaContext.rid,
					AmazonS3: {
						path
					}
				};

				RocketChat.models.Uploads.insertFileInit(this.userId, 'AmazonS3:Uploads', file, upload);

				return path;
			},
			AWSAccessKeyId: accessKey,
			AWSSecretAccessKey: secretKey
		};

		if (!_.isEmpty(acl)) {
			config.acl = acl;
		}

		if (!_.isEmpty(cdn)) {
			config.cdn = cdn;
		}

		if (!_.isEmpty(region)) {
			config.region = region;
		}

		if (!_.isEmpty(bucketUrl)) {
			config.bucketUrl = bucketUrl;
		}

		try {
			Slingshot.createDirective('rocketchat-uploads', Slingshot.S3Storage, config);
		} catch (e) {
			console.error('Error configuring S3 ->', e.message);
		}
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);



const createGoogleStorageDirective = _.debounce(() => {
	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
	const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
	const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');

	delete Slingshot._directives['rocketchat-uploads-gs'];

	if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
		if (Slingshot._directives['rocketchat-uploads-gs']) {
			delete Slingshot._directives['rocketchat-uploads-gs'];
		}

		const config = {
			bucket,
			GoogleAccessId: accessId,
			GoogleSecretKey: secret,
			key(file, metaContext) {
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
			}
		};

		try {
			Slingshot.createDirective('rocketchat-uploads-gs', Slingshot.GoogleCloud, config);
		} catch (e) {
			console.error('Error configuring GoogleCloudStorage ->', e.message);
		}
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
