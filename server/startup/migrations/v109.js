import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 109,
	up() {
		const FileUpload_GoogleStorage_Proxy = (Settings.findOne({ _id: 'FileUpload_GoogleStorage_Proxy' }) || {}).value === true;
		const FileUpload_S3_Proxy = (Settings.findOne({ _id: 'FileUpload_S3_Proxy' }) || {}).value === true;

		Settings.update({ _id: 'FileUpload_GoogleStorage_Proxy_Avatars' }, { $set: { value: FileUpload_GoogleStorage_Proxy } });
		Settings.update({ _id: 'FileUpload_GoogleStorage_Proxy_Uploads' }, { $set: { value: FileUpload_GoogleStorage_Proxy } });

		Settings.update({ _id: 'FileUpload_S3_Proxy_Avatars' }, { $set: { value: FileUpload_S3_Proxy } });
		Settings.update({ _id: 'FileUpload_S3_Proxy_Uploads' }, { $set: { value: FileUpload_S3_Proxy } });

		Settings.remove({ _id: 'FileUpload_GoogleStorage_Proxy' });
		Settings.remove({ _id: 'FileUpload_S3_Proxy' });
	},
});
