/* globals Slingshot, FileUpload, AWS */
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
	const directives = [
		{
			name: 'rocketchat-uploads',
			key(file, metaContext) {
				const path = `${ RocketChat.hostname }/${ metaContext.rid }/${ this.userId }/`;

				const upload = {
					rid: metaContext.rid,
					s3: {
						bucket: RocketChat.settings.get('FileUpload_S3_Bucket'),
						region: RocketChat.settings.get('FileUpload_S3_Region'),
						path
					}
				};
				const fileId = RocketChat.models.Uploads.insertFileInit(this.userId, 's3', file, upload);

				return path + fileId;
			}
		},
		{
			name: 'rocketchat-avatars',
			key(file/*, metaContext*/) {
				const path = `${ RocketChat.hostname }/avatars/`;

				const user = RocketChat.models.Users.findOneById(this.userId);

				const upload = {
					username: user && user.username,
					s3: {
						bucket: RocketChat.settings.get('FileUpload_S3_Bucket'),
						region: RocketChat.settings.get('FileUpload_S3_Region'),
						path
					}
				};
				delete file.name;
				RocketChat.models.Avatars.insertAvatarFileInit(user.username, this.userId, 's3', file, upload);

				return path + user.username;
			}
		}
	];

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
		directives.forEach((conf) => {
			createDirective(conf.name, { key: conf.key, bucket, accessKey, secretKey, region, acl, cdn, bucketUrl});
		});
	} else {
		directives.forEach((conf) => {
			if (Slingshot._directives[conf.name]) {
				delete Slingshot._directives[conf.name];
			}
		});
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);

RocketChat.settings.get('FileUpload_S3_Bucket', configureSlingshot);

RocketChat.settings.get('FileUpload_S3_Acl', configureSlingshot);

RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
	configureSlingshot();
});

RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
	configureSlingshot();
});

RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan', function(key, value) {
	S3expiryTimeSpan = value;
	configureSlingshot();
});

RocketChat.settings.get('FileUpload_S3_CDN', configureSlingshot);

RocketChat.settings.get('FileUpload_S3_Region', configureSlingshot);

RocketChat.settings.get('FileUpload_S3_BucketURL', configureSlingshot);
