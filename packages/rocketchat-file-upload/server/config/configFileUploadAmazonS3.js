/* globals Slingshot, FileUpload, AWS, SystemLogger */
var crypto = Npm.require('crypto');

var S3accessKey, S3secretKey;

var generateURL = function(file) {
	if (!file || !file.s3) {
		return;
	}
	let resourceURL = '/' + file.s3.bucket + '/' + file.s3.path + file._id;
	let expires = parseInt(new Date().getTime() / 1000) + 60;
	let StringToSign = 'GET\n\n\n' + expires +'\n'+resourceURL;
	let signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, 'utf-8')).digest('base64');
	return file.url + '?AWSAccessKeyId='+encodeURIComponent(S3accessKey)+'&Expires='+expires+'&Signature='+encodeURIComponent(signature);
};

FileUpload.addHandler('s3', {
	get(file, req, res) {
		let fileUrl = generateURL(file);

		if (fileUrl) {
			res.setHeader('Location', fileUrl);
			res.writeHead(302);
		}
		res.end();
	},
	delete(file) {
		let s3 = new AWS.S3();
		let request = s3.deleteObject({
			Bucket: file.s3.bucket,
			Key: file.s3.path + file._id
		});
		request.send();
	}
});

var createS3Directive = _.debounce(() => {
	var directiveName = 'rocketchat-uploads';

	var type = RocketChat.settings.get('FileUpload_Storage_Type');
	var bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	var acl = RocketChat.settings.get('FileUpload_S3_Acl');
	var accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	var secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	var cdn = RocketChat.settings.get('FileUpload_S3_CDN');
	var region = RocketChat.settings.get('FileUpload_S3_Region');
	var bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');

	AWS.config.update({
		accessKeyId: RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId'),
		secretAccessKey: RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey')
	});

	if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
		if (Slingshot._directives[directiveName]) {
			delete Slingshot._directives[directiveName];
		}
		var config = {
			bucket: bucket,
			AWSAccessKeyId: accessKey,
			AWSSecretAccessKey: secretKey,
			key: function(file, metaContext) {
				var path = RocketChat.hostname + '/' + metaContext.rid + '/' + this.userId + '/';

				let upload = {
					s3: {
						bucket: bucket,
						region: region,
						path: path
					}
				};
				let fileId = RocketChat.models.Uploads.insertFileInit(metaContext.rid, this.userId, 's3', file, upload);

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

RocketChat.settings.get('FileUpload_S3_CDN', createS3Directive);

RocketChat.settings.get('FileUpload_S3_Region', createS3Directive);

RocketChat.settings.get('FileUpload_S3_BucketURL', createS3Directive);
