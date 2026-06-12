import { up } from './v336';

const mockFindOne = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Settings: {
		findOne: (...args: any[]) => mockFindOne(...args),
		deleteMany: (...args: any[]) => mockDeleteMany(...args),
	},
}));

jest.mock('../../lib/migrations', () => ({
	addMigration: jest.fn(),
}));

const WEBDAV_SETTING_IDS = [
	'Webdav Integration',
	'Webdav_Integration_Enabled',
	'FileUpload_Webdav_Upload_Folder_Path',
	'FileUpload_Webdav_Server_URL',
	'FileUpload_Webdav_Username',
	'FileUpload_Webdav_Password',
	'FileUpload_Webdav_Proxy_Avatars',
	'FileUpload_Webdav_Proxy_Uploads',
	'FileUpload_Webdav_Proxy_UserDataFiles',
];

describe('Migration v336 - Remove WebDAV integration settings', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockDeleteMany.mockResolvedValue({ deletedCount: 0 });
	});

	it('throws if FileUpload_Storage_Type is set to Webdav', async () => {
		mockFindOne.mockResolvedValue({ _id: 'FileUpload_Storage_Type', value: 'Webdav' });

		await expect(up()).rejects.toThrow('WebDAV file storage is no longer supported.');
	});

	it('error message includes recovery instructions', async () => {
		mockFindOne.mockResolvedValue({ _id: 'FileUpload_Storage_Type', value: 'Webdav' });

		await expect(up()).rejects.toThrow('db.rocketchat_settings.updateOne');
	});

	it('does not delete any settings when storage type is Webdav', async () => {
		mockFindOne.mockResolvedValue({ _id: 'FileUpload_Storage_Type', value: 'Webdav' });

		await expect(up()).rejects.toThrow();
		expect(mockDeleteMany).not.toHaveBeenCalled();
	});

	it('deletes all WebDAV settings when storage type is not Webdav', async () => {
		mockFindOne.mockResolvedValue({ _id: 'FileUpload_Storage_Type', value: 'GridFS' });

		await up();

		expect(mockDeleteMany).toHaveBeenCalledWith({ _id: { $in: WEBDAV_SETTING_IDS } });
	});

	it('deletes all WebDAV settings when FileUpload_Storage_Type setting does not exist', async () => {
		mockFindOne.mockResolvedValue(null);

		await up();

		expect(mockDeleteMany).toHaveBeenCalledWith({ _id: { $in: WEBDAV_SETTING_IDS } });
	});

	it('does not throw when storage type is AmazonS3', async () => {
		mockFindOne.mockResolvedValue({ _id: 'FileUpload_Storage_Type', value: 'AmazonS3' });

		await expect(up()).resolves.not.toThrow();
	});
});
