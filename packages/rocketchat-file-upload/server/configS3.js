createS3Directive = _.debounce(() => {
	var directiveName = 'rocketchat-uploads';

	var type = RocketChat.settings.get('FileUpload_Storage_Type');
	var bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
	var acl = RocketChat.settings.get('FileUpload_S3_Acl');
	var accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
	var secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');

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

				// @TODO what should we do when a file already exists with the given name?
				var path = serverIdentifier + this.userId + '-' + metaContext.rid + "/";
				if (file.name) {
					return path + file.name;
				} else {
					return path + Random.id();
				}
			}
		};

		if (!_.isEmpty(acl)) {
			config.acl = acl;
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
