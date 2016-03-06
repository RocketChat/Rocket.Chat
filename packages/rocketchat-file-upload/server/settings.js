Meteor.startup(function() {
	RocketChat.settings.add('FileUpload_Storage_Type', 'GridFS', {
		group: 'FileUpload',
		type: 'select',
		values: [{
			key: 'GridFS',
			i18nLabel: 'GridFS'
		}, {
			key: 'AmazonS3',
			i18nLabel: 'AmazonS3'
		}],
		public: true
	});

	RocketChat.settings.add('FileUpload_S3_Bucket', '', {
		group: 'FileUpload',
		section: 'Amazon S3',
		type: 'string',
		enableQuery: {
			_id: 'FileUpload_Storage_Type',
			value: 'AmazonS3'
		}
	});
	RocketChat.settings.add('FileUpload_S3_Acl', 'public-read', {
		group: 'FileUpload',
		section: 'Amazon S3',
		type: 'string',
		enableQuery: {
			_id: 'FileUpload_Storage_Type',
			value: 'AmazonS3'
		}
	});
	RocketChat.settings.add('FileUpload_S3_AWSAccessKeyId', '', {
		group: 'FileUpload',
		section: 'Amazon S3',
		type: 'string',
		enableQuery: {
			_id: 'FileUpload_Storage_Type',
			value: 'AmazonS3'
		}
	});
	RocketChat.settings.add('FileUpload_S3_AWSSecretAccessKey', '', {
		group: 'FileUpload',
		section: 'Amazon S3',
		type: 'string',
		enableQuery: {
			_id: 'FileUpload_Storage_Type',
			value: 'AmazonS3'
		}
	});
});

