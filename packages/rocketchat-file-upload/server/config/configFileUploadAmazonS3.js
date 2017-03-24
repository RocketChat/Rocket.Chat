/* globals Slingshot, FileUpload, AWS, SystemLogger */
const crypto = Npm.require('crypto');

let S3accessKey;
let S3secretKey;
let S3expiryTimeSpan;

const generateURL = function(file) {
	if (!file || !file.s3) {
		return;
	}
	const resourceURL = `/${ file.s3.bucket }/${ file.s3.path }${ file._id }`;
	const expires = parseInt(new Date().getTime() / 1000) + Math.max(5, S3expiryTimeSpan);
	const StringToSign = `GET\n\n\n${ expires }\n${ resourceURL }`;
	const signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, 'utf-8')).digest('base64');
	return `${ file.url }?AWSAccessKeyId=${ encodeURIComponent(S3accessKey) }&Expires=${ expires }&Signature=${ encodeURIComponent(signature) }`;
};

FileUpload.addHandler('s3', {
	get(file, req, res) {
		const fileUrl = generateURL(file);

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	},
	delete(file) {
		const s3 = new AWS.S3();
		const request = s3.deleteObject({
			Bucket: file.s3.bucket,
			Key: file.s3.path + file._id
		});
		request.send();
	}
});

const createS3Directive = _.debounce(() => {
	const directiveName = 'rocketchat-uploads';

	const type = RocketChat.settings.get('FileUpload_Storage_Type');
	const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	const acl = RocketChat.settings.get('FileUpload_S3_Acl');
	const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
	const region = RocketChat.settings.get('FileUpload_S3_Region');
	const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');

	AWS.config.update({
		accessKeyId: RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId'),
		secretAccessKey: RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey')
	});

	if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
		if (Slingshot._directives[directiveName]) {
			delete Slingshot._directives[directiveName];
		}
		const config = {
			bucket,
			AWSAccessKeyId: accessKey,
			AWSSecretAccessKey: secretKey,
			key(file, metaContext) {
				const path = `${ RocketChat.hostname }/${ metaContext.rid }/${ this.userId }/`;

				const upload = { s3: {
					bucket,
					region,
					path
				}};
				const fileId = RocketChat.models.Uploads.insertFileInit(metaContext.rid, this.userId, 's3', file, upload);

				return path + fileId;
			}
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
			SystemLogger.error('Error configuring S3 ->', e.message);
		}
	} else if (Slingshot._directives[directiveName]) {
		delete Slingshot._directives[directiveName];
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createS3Directive);

RocketChat.settings.get('FileUpload_S3_Bucket', createS3Directive);

RocketChat.settings.get('FileUpload_S3_Acl', createS3Directive);

RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan', function(key, value) {
	S3expiryTimeSpan = value;
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_CDN', createS3Directive);

RocketChat.settings.get('FileUpload_S3_Region', createS3Directive);

RocketChat.settings.get('FileUpload_S3_BucketURL', createS3Directive);
