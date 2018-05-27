RocketChat.Migrations.add({
	version: 109,
	up() {
		const FileUpload_GoogleStorage_Proxy = (RocketChat.models.Settings.findOne({_id: 'FileUpload_GoogleStorage_Proxy'}) || {}).value === true;
		const FileUpload_S3_Proxy = (RocketChat.models.Settings.findOne({_id: 'FileUpload_S3_Proxy'}) || {}).value === true;

		RocketChat.models.Settings.update({_id: 'FileUpload_GoogleStorage_Proxy_Avatars'}, {$set: {value: FileUpload_GoogleStorage_Proxy}});
		RocketChat.models.Settings.update({_id: 'FileUpload_GoogleStorage_Proxy_Uploads'}, {$set: {value: FileUpload_GoogleStorage_Proxy}});

		RocketChat.models.Settings.update({_id: 'FileUpload_S3_Proxy_Avatars'}, {$set: {value: FileUpload_S3_Proxy}});
		RocketChat.models.Settings.update({_id: 'FileUpload_S3_Proxy_Uploads'}, {$set: {value: FileUpload_S3_Proxy}});

		RocketChat.models.Settings.remove({_id: 'FileUpload_GoogleStorage_Proxy'});
		RocketChat.models.Settings.remove({_id: 'FileUpload_S3_Proxy'});
	}
});
