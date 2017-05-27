/* globals Slingshot, FileUpload */

function createDirective(directiveName, { key, bucket, accessKey, secretKey, region, acl, cdn, bucketUrl}) {
	if (Slingshot._directives[directiveName]) {
		delete Slingshot._directives[directiveName];
	}
	const config = {
		bucket,
		key,
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
		Slingshot.createDirective(directiveName, Slingshot.S3Storage, config);
	} catch (e) {
		console.error('Error configuring S3 ->', e.message);
	}
}

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
		createDirective('rocketchat-uploads', {
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
			bucket,
			accessKey,
			secretKey,
			region,
			acl,
			cdn,
			bucketUrl
		});
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);
