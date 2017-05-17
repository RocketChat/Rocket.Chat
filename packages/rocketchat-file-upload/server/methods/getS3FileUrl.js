import AWS4 from '../lib/AWS4.js';

let protectedFiles;
let S3accessKey;
let S3secretKey;
let S3expiryTimeSpan;

RocketChat.settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
});

RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
});

RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan', function(key, value) {
	S3expiryTimeSpan = value;
});

Meteor.methods({
	getS3FileUrl(fileId) {
		if (protectedFiles && !Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'sendFileMessage' });
		}
		const file = RocketChat.models.Uploads.findOneById(fileId);

		const credential = {
			accessKeyId: S3accessKey,
			secretKey: S3secretKey
		};

		const req = {
			bucket: file.s3.bucket,
			region: file.s3.region,
			path: `/${ file.s3.path }${ file._id }`,
			url: file.url,
			expire: Math.max(5, S3expiryTimeSpan)
		};

		const queryString = AWS4.sign(req, credential);

		return `${ file.url }?${ queryString }`;
	}
});
