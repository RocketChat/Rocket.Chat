import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

export async function up(): Promise<void> {
	const storageType = await Settings.findOne({ _id: 'FileUpload_Storage_Type' }, { projection: { value: 1 } });

	if (storageType?.value === 'Webdav') {
		throw new Error(
			[
				'WebDAV file storage is no longer supported.',
				'',
				'Your server is currently using WebDAV as the file upload storage backend.',
				'You must change the "FileUpload_Storage_Type" setting to a supported provider',
				'(GridFS, AmazonS3, GoogleCloudStorage, or FileSystem) before upgrading.',
				'',
				'To fix this:',
				'  1. Downgrade to your previous Rocket.Chat version.',
				'  2. Go to Admin > File Upload and change the Storage Type.',
				'  3. Migrate existing files to the new storage provider.',
				'  4. Upgrade again.',
				'',
				'Alternatively, update the "FileUpload_Storage_Type" value directly in MongoDB:',
				'  db.rocketchat_settings.updateOne({ _id: "FileUpload_Storage_Type" }, { $set: { value: "GridFS" } })',
				'Note: this will not migrate your existing files.',
			].join('\n'),
		);
	}

	await Settings.deleteMany({
		_id: {
			$in: [
				'Webdav Integration',
				'Webdav_Integration_Enabled',
				'FileUpload_Webdav_Upload_Folder_Path',
				'FileUpload_Webdav_Server_URL',
				'FileUpload_Webdav_Username',
				'FileUpload_Webdav_Password',
				'FileUpload_Webdav_Proxy_Avatars',
				'FileUpload_Webdav_Proxy_Uploads',
				'FileUpload_Webdav_Proxy_UserDataFiles',
			],
		},
	});
}

addMigration({ version: 336, name: 'Remove WebDAV integration settings', up });
