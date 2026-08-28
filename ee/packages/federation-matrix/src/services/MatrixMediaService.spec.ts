import { Upload } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Uploads } from '@rocket.chat/models';

import { MatrixMediaService } from './MatrixMediaService';

jest.mock('@rocket.chat/core-services', () => ({
	Upload: {
		createPendingFile: jest.fn(),
		completePendingFile: jest.fn(),
		uploadFile: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		downloadFromRemoteServer: jest.fn(),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Uploads: {
		findOneById: jest.fn(),
		findByFederationMediaIdAndServerName: jest.fn(),
		setFederationRoomInfo: jest.fn(),
		setFederationInfo: jest.fn(),
	},
	Avatars: {},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() })),
}));

const mockCreatePendingFile = Upload.createPendingFile as jest.MockedFunction<typeof Upload.createPendingFile>;
const mockCompletePendingFile = Upload.completePendingFile as jest.MockedFunction<typeof Upload.completePendingFile>;
const mockDownload = federationSDK.downloadFromRemoteServer as jest.MockedFunction<typeof federationSDK.downloadFromRemoteServer>;
const mockFindOneById = Uploads.findOneById as jest.MockedFunction<typeof Uploads.findOneById>;
const mockFindByFederation = Uploads.findByFederationMediaIdAndServerName as jest.MockedFunction<
	typeof Uploads.findByFederationMediaIdAndServerName
>;

const MXC = 'mxc://remote.example/abc123';

const metadata = { name: 'holiday.png', size: 2048, type: 'image/png', rid: 'rid1', userId: 'uid1' };

describe('MatrixMediaService.registerRemoteFile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not download anything', async () => {
		mockFindByFederation.mockResolvedValueOnce(null);
		mockCreatePendingFile.mockResolvedValueOnce({ _id: 'upload1' } as any);

		await MatrixMediaService.registerRemoteFile(MXC, '!room:remote.example', metadata as any);

		expect(mockDownload).not.toHaveBeenCalled();
	});

	it('records the mxc coordinates so the file can be fetched later', async () => {
		mockFindByFederation.mockResolvedValueOnce(null);
		mockCreatePendingFile.mockResolvedValueOnce({ _id: 'upload1' } as any);

		const fileId = await MatrixMediaService.registerRemoteFile(MXC, '!room:remote.example', metadata as any);

		expect(fileId).toBe('upload1');
		expect(mockCreatePendingFile).toHaveBeenCalledWith({
			userId: 'uid1',
			details: metadata,
			federation: { mxcUri: MXC, mrid: '!room:remote.example', serverName: 'remote.example', mediaId: 'abc123' },
		});
	});

	it('reuses a file that is already known', async () => {
		mockFindByFederation.mockResolvedValueOnce({ _id: 'existing', rid: 'rid1' } as any);

		const fileId = await MatrixMediaService.registerRemoteFile(MXC, '!room:remote.example', metadata as any);

		expect(fileId).toBe('existing');
		expect(mockCreatePendingFile).not.toHaveBeenCalled();
	});

	it('rejects a malformed mxc uri', async () => {
		await expect(MatrixMediaService.registerRemoteFile('not-an-mxc-uri', '!room:remote.example', metadata as any)).rejects.toThrow(
			'Invalid MXC URI',
		);
	});
});

describe('MatrixMediaService.materializePendingFile', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('downloads and completes the upload on first access', async () => {
		const buffer = Buffer.from('image-bytes');
		mockFindOneById.mockResolvedValueOnce({
			_id: 'upload1',
			complete: false,
			federation: { serverName: 'remote.example', mediaId: 'abc123', mxcUri: MXC },
		} as any);
		mockDownload.mockResolvedValueOnce(buffer);
		mockCompletePendingFile.mockResolvedValueOnce({ _id: 'upload1', complete: true } as any);

		const result = await MatrixMediaService.materializePendingFile('upload1');

		expect(mockDownload).toHaveBeenCalledWith('remote.example', 'abc123');
		expect(mockCompletePendingFile).toHaveBeenCalledWith({ fileId: 'upload1', buffer });
		expect(result).toEqual({ _id: 'upload1', complete: true });
	});

	it('serves an already complete file without downloading again', async () => {
		mockFindOneById.mockResolvedValueOnce({ _id: 'upload1', complete: true, federation: { mxcUri: MXC } } as any);

		const result = await MatrixMediaService.materializePendingFile('upload1');

		expect(mockDownload).not.toHaveBeenCalled();
		expect(result).toEqual({ _id: 'upload1', complete: true, federation: { mxcUri: MXC } });
	});

	it('returns null for an unknown file', async () => {
		mockFindOneById.mockResolvedValueOnce(null);

		await expect(MatrixMediaService.materializePendingFile('nope')).resolves.toBeNull();
		expect(mockDownload).not.toHaveBeenCalled();
	});

	it('returns null when the file is not federated', async () => {
		mockFindOneById.mockResolvedValueOnce({ _id: 'upload1', complete: false } as any);

		await expect(MatrixMediaService.materializePendingFile('upload1')).resolves.toBeNull();
		expect(mockDownload).not.toHaveBeenCalled();
	});

	it('collapses concurrent requests for the same file into one download', async () => {
		const buffer = Buffer.from('image-bytes');
		mockFindOneById.mockResolvedValue({
			_id: 'upload2',
			complete: false,
			federation: { serverName: 'remote.example', mediaId: 'abc123', mxcUri: MXC },
		} as any);
		let release: (value: Buffer) => void = () => undefined;
		mockDownload.mockReturnValueOnce(
			new Promise<Buffer>((resolve) => {
				release = resolve;
			}),
		);
		mockCompletePendingFile.mockResolvedValue({ _id: 'upload2', complete: true } as any);

		const first = MatrixMediaService.materializePendingFile('upload2');
		const second = MatrixMediaService.materializePendingFile('upload2');
		release(buffer);

		await Promise.all([first, second]);

		expect(mockDownload).toHaveBeenCalledTimes(1);
	});

	it('propagates a download failure so the caller can report it as retryable', async () => {
		mockFindOneById.mockResolvedValueOnce({
			_id: 'upload3',
			complete: false,
			federation: { serverName: 'remote.example', mediaId: 'abc123', mxcUri: MXC },
		} as any);
		mockDownload.mockRejectedValueOnce(new Error('Failed to download media abc123 from remote.example'));

		await expect(MatrixMediaService.materializePendingFile('upload3')).rejects.toThrow('Failed to download media');
	});

	it('allows a later attempt after a failure', async () => {
		mockFindOneById.mockResolvedValue({
			_id: 'upload4',
			complete: false,
			federation: { serverName: 'remote.example', mediaId: 'abc123', mxcUri: MXC },
		} as any);
		mockDownload.mockRejectedValueOnce(new Error('not committed yet'));

		await expect(MatrixMediaService.materializePendingFile('upload4')).rejects.toThrow('not committed yet');

		mockDownload.mockResolvedValueOnce(Buffer.from('bytes'));
		mockCompletePendingFile.mockResolvedValueOnce({ _id: 'upload4', complete: true } as any);

		await expect(MatrixMediaService.materializePendingFile('upload4')).resolves.toEqual({ _id: 'upload4', complete: true });
		expect(mockDownload).toHaveBeenCalledTimes(2);
	});
});
