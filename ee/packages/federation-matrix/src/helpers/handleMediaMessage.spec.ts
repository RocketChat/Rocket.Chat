import { federationSDK } from '@rocket.chat/federation-sdk';

import { handleMediaMessage } from './handleMediaMessage';
import { MatrixMediaService } from '../services/MatrixMediaService';

jest.mock('../services/MatrixMediaService', () => ({
	MatrixMediaService: {
		registerRemoteFile: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		downloadFromRemoteServer: jest.fn(),
	},
}));

const mockRegisterRemoteFile = MatrixMediaService.registerRemoteFile as jest.MockedFunction<typeof MatrixMediaService.registerRemoteFile>;
const mockDownload = federationSDK.downloadFromRemoteServer as jest.MockedFunction<typeof federationSDK.downloadFromRemoteServer>;

const user = { _id: 'uid1' } as any;
const room = { _id: 'rid1' } as any;
const fileInfo = { size: 4096, mimetype: 'image/png', w: 800, h: 600 } as any;

describe('handleMediaMessage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRegisterRemoteFile.mockResolvedValue('upload1');
	});

	it('does not download the file while handling the event', async () => {
		await handleMediaMessage(
			'mxc://remote.example/abc123',
			fileInfo,
			'm.image',
			'holiday.png',
			user,
			room,
			'!room:remote.example',
			'$event1' as any,
		);

		expect(mockDownload).not.toHaveBeenCalled();
		expect(mockRegisterRemoteFile).toHaveBeenCalledTimes(1);
	});

	it('builds the attachment from metadata carried by the event', async () => {
		const result = await handleMediaMessage(
			'mxc://remote.example/abc123',
			fileInfo,
			'm.image',
			'holiday.png',
			user,
			room,
			'!room:remote.example',
			'$event1' as any,
		);

		expect(result.attachments[0]).toMatchObject({
			title: 'holiday.png',
			image_url: '/file-upload/upload1/holiday.png',
			image_type: 'image/png',
			image_size: 4096,
			image_dimensions: { width: 800, height: 600 },
		});
		expect(result.rid).toBe('rid1');
		expect(result.federation_event_id).toBe('$event1');
	});

	it('links to the registered upload for non-image files', async () => {
		const result = await handleMediaMessage(
			'mxc://remote.example/abc123',
			{ size: 10, mimetype: 'application/pdf' } as any,
			'm.file',
			'report.pdf',
			user,
			room,
			'!room:remote.example',
			'$event2' as any,
		);

		expect(result.attachments[0]).toMatchObject({
			title: 'report.pdf',
			title_link: '/file-upload/upload1/report.pdf',
			title_link_download: true,
		});
		expect(mockDownload).not.toHaveBeenCalled();
	});
});
