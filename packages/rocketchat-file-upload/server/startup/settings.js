RocketChat.settings.addGroup('FileUpload', function() {
	this.add('FileUpload_Enabled', true, {
		type: 'boolean',
		public: true
	});

	this.add('FileUpload_MaxFileSize', 2097152, {
		type: 'int',
		public: true
	});

	this.add('FileUpload_MediaTypeWhiteList', 'image/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
		type: 'string',
		public: true,
		i18nDescription: 'FileUpload_MediaTypeWhiteListDescription'
	});

	this.add('FileUpload_ProtectFiles', false, {
		type: 'boolean',
		public: true,
		i18nDescription: 'FileUpload_ProtectFilesDescription'
	});

	this.add('FileUpload_Storage_Type', 'GridFS', {
		type: 'select',
		values: [{
			key: 'GridFS',
			i18nLabel: 'GridFS'
		}, {
			key: 'AmazonS3',
			i18nLabel: 'AmazonS3'
		}, {
			key: 'FileSystem',
			i18nLabel: 'FileSystem'
		}],
		public: true
	});

	this.section('Amazon S3', function() {
		this.add('FileUpload_S3_Bucket', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_Acl', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_AWSAccessKeyId', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_AWSSecretAccessKey', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_CDN', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_Region', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			}
		});
		this.add('FileUpload_S3_BucketURL', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'AmazonS3'
			},
			i18nDescription: 'Override_URL_to_which_files_are_uploaded_This_url_also_used_for_downloads_unless_a_CDN_is_given.'
		});
	});

	this.section('File System', function() {
		this.add('FileUpload_FileSystemPath', '', {
			type: 'string',
			enableQuery: {
				_id: 'FileUpload_Storage_Type',
				value: 'FileSystem'
			}
		});
	});
});
