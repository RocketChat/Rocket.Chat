createS3Directive = _.debounce(() => {
	var directiveName = 'rocketchat-uploads';

	var type = RocketChat.settings.get('FileUpload_Storage_Type');
	var bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	var acl = RocketChat.settings.get('FileUpload_S3_Acl');
	var accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	var secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
	var cdn = RocketChat.settings.get('FileUpload_S3_CDN');
	var region = RocketChat.settings.get('FileUpload_S3_Region');
	var bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');

	if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
		if (Slingshot._directives[directiveName]) {
			delete Slingshot._directives[directiveName];
		}
		var config = {
			bucket: bucket,
			AWSAccessKeyId: accessKey,
			AWSSecretAccessKey: secretKey,
			key: function (file, metaContext) {
				var serverIdentifier = '';
				var path = serverIdentifier + metaContext.rid + '/' + this.userId + "/";
				return path + Random.id();
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

		Slingshot.createDirective(directiveName, Slingshot.S3Storage, config);
	} else {
		if (Slingshot._directives[directiveName]) {
			delete Slingshot._directives[directiveName];
		}
	}
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_Bucket', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_Acl', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_CDN', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_Region', function(settingKey, settingValue) {
	createS3Directive();
});

RocketChat.settings.get('FileUpload_S3_BucketURL', function(settingKey, settingValue) {
	createS3Directive();
});
