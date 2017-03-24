const crypto = Npm.require('crypto');
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
		const resourceURL = `/${ file.s3.bucket }/${ file.s3.path }${ file._id }`;
		const expires = parseInt(new Date().getTime() / 1000) + Math.max(5, S3expiryTimeSpan);
		const StringToSign = `GET\n\n\n${ expires }\n${ resourceURL }`;
		const signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, 'utf-8')).digest('base64');
		return {
			url:`${ file.url }?AWSAccessKeyId=${ encodeURIComponent(S3accessKey) }&Expires=${ expires }&Signature=${ encodeURIComponent(signature) }`
		};
	}
});
