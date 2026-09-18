import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';

import { api } from '@rocket.chat/core-services';
import type { IMessage, IUpload, IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Uploads, Users } from '@rocket.chat/models';
import sharp from 'sharp';

import { UploadService } from './service';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { canDeleteMessageAsync } from '../../lib/authorization/canDeleteMessage';
import { FileUpload } from '../../lib/media/file-upload';
import { updateMessage } from '../../lib/messages/updateMessage';
import { setUserAvatar } from '../../lib/users/setUserAvatar';
import { UploadFS } from '../../ufs';

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: jest.fn() },
	ServiceClassInternal: class {},
}));
jest.mock('@rocket.chat/models', () => ({
	Uploads: { findAllByOriginalFileId: jest.fn() },
	Users: { unsetAvatarData: jest.fn() },
}));
jest.mock('@rocket.chat/logger', () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));
jest.mock('../../lib/media/file-upload', () => ({ FileUpload: { getStore: jest.fn(), getBuffer: jest.fn() } }));
jest.mock('../../lib/authorization/canAccessRoom', () => ({ canAccessRoomIdAsync: jest.fn() }));
jest.mock('../../lib/authorization/canDeleteMessage', () => ({ canDeleteMessageAsync: jest.fn() }));
jest.mock('../../lib/messages/updateMessage', () => ({ updateMessage: jest.fn() }));
jest.mock('../../lib/users/setUserAvatar', () => ({ setUserAvatar: jest.fn() }));
jest.mock('../../lib/i18n', () => ({ i18n: { t: (key: string) => key } }));
jest.mock('../../meteor-methods/messages/sendFileMessage', () => ({
	sendFileMessage: jest.fn(),
	parseFileIntoMessageAttachments: jest.fn(),
}));
jest.mock('../../meteor-methods/omnichannel/sendFileLivechatMessage', () => ({ sendFileLivechatMessage: jest.fn() }));
jest.mock('../../ufs', () => ({ UploadFS: { getTempFilePath: jest.fn() } }));

const { error: logError } = jest.mocked(Logger).mock.results[0].value;

const uploadsStore = { insert: jest.fn(), deleteById: jest.fn(), _store: { getReadStream: jest.fn() } };
const avatarsStore = { deleteByName: jest.fn() };

const cursorOf = (ids: string[]) => ({
	map: (fn: (doc: { _id: string }) => string) => ({ toArray: async () => ids.map((_id) => fn({ _id })) }),
});

const waitForRemoval = async (file: string) => {
	for (let attempt = 0; attempt < 100 && fs.existsSync(file); attempt++) {
		await new Promise((resolve) => setImmediate(resolve));
	}
	return fs.existsSync(file);
};

const user = { _id: 'u1', username: 'jane' } as IUser;
const uploadedAt = new Date('2026-09-01T10:00:00.000Z');

describe('UploadService', () => {
	let service: UploadService;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(FileUpload.getStore).mockImplementation((name) => ({ Uploads: uploadsStore, Avatars: avatarsStore })[name] as any);
		jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf([]) as any);
		uploadsStore.deleteById.mockResolvedValue(undefined);
		service = new UploadService();
	});

	describe('canDeleteFile', () => {
		const file = { _id: 'f1', userId: 'u2', rid: 'r1', uploadedAt };

		it('answers with the message deletion check when the file has a message', async () => {
			const msg = { _id: 'm1', rid: 'r1' } as IMessage;

			jest.mocked(canDeleteMessageAsync).mockResolvedValue(false);
			await expect(service.canDeleteFile(user, file, msg)).resolves.toBe(false);

			jest.mocked(canDeleteMessageAsync).mockResolvedValue(true);
			await expect(service.canDeleteFile(user, file, msg)).resolves.toBe(true);

			expect(canDeleteMessageAsync).toHaveBeenCalledWith(user, msg);
			expect(canAccessRoomIdAsync).not.toHaveBeenCalled();
		});

		it('rejects an orphan file that has no owner or no room', async () => {
			await expect(service.canDeleteFile(user, { ...file, userId: undefined }, null)).resolves.toBe(false);
			await expect(service.canDeleteFile(user, { ...file, rid: undefined }, null)).resolves.toBe(false);

			expect(canDeleteMessageAsync).not.toHaveBeenCalled();
			expect(canAccessRoomIdAsync).not.toHaveBeenCalled();
		});

		it('answers with room access for an unconfirmed file owned by the requesting user', async () => {
			const unconfirmed = { ...file, userId: user._id, expiresAt: new Date() };

			jest.mocked(canAccessRoomIdAsync).mockResolvedValue(false);
			await expect(service.canDeleteFile(user, unconfirmed, null)).resolves.toBe(false);

			jest.mocked(canAccessRoomIdAsync).mockResolvedValue(true);
			await expect(service.canDeleteFile(user, unconfirmed, null)).resolves.toBe(true);

			expect(canAccessRoomIdAsync).toHaveBeenCalledWith('r1', 'u1');
			expect(canDeleteMessageAsync).not.toHaveBeenCalled();
		});

		it('runs the message deletion check over data built from a confirmed file of the requesting user', async () => {
			jest.mocked(canDeleteMessageAsync).mockResolvedValue(true);

			await expect(service.canDeleteFile(user, { ...file, userId: user._id }, null)).resolves.toBe(true);

			expect(canDeleteMessageAsync).toHaveBeenCalledWith(user, { u: { _id: 'u1' }, ts: uploadedAt, rid: 'r1' });
			expect(canAccessRoomIdAsync).not.toHaveBeenCalled();
		});

		it('runs the message deletion check over an unconfirmed file owned by someone else', async () => {
			jest.mocked(canDeleteMessageAsync).mockResolvedValue(true);

			await expect(service.canDeleteFile(user, { ...file, expiresAt: new Date() }, null)).resolves.toBe(true);

			expect(canDeleteMessageAsync).toHaveBeenCalledWith(user, { u: { _id: 'u2' }, ts: uploadedAt, rid: 'r1' });
			expect(canAccessRoomIdAsync).not.toHaveBeenCalled();
		});
	});

	describe('deleteFile', () => {
		it('deletes the original file before its derivatives and returns every id removed', async () => {
			jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf(['thumb1', 'thumb2']) as any);

			await expect(service.deleteFile(user, 'f1', null)).resolves.toEqual({ deletedFiles: ['f1', 'thumb1', 'thumb2'] });

			expect(Uploads.findAllByOriginalFileId).toHaveBeenCalledWith('f1', { projection: { _id: 1 } });
			expect(uploadsStore.deleteById.mock.calls).toEqual([['f1'], ['thumb1'], ['thumb2']]);
		});

		it('updates the message before any file is deleted', async () => {
			jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf(['thumb1']) as any);
			const msg = { _id: 'm1', rid: 'r1', files: [{ _id: 'f1', name: 'a' }] } as IMessage;

			await service.deleteFile(user, 'f1', msg);

			expect(updateMessage).toHaveBeenCalledTimes(1);
			expect(jest.mocked(updateMessage).mock.invocationCallOrder[0]).toBeLessThan(uploadsStore.deleteById.mock.invocationCallOrder[0]);
			expect(jest.mocked(updateMessage).mock.calls[0][0].files).toEqual([]);
		});

		it('logs a derivative that could not be deleted and removes the remaining ones', async () => {
			jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf(['thumb1', 'thumb2']) as any);
			const err = new Error('storage is down');
			uploadsStore.deleteById.mockResolvedValueOnce(undefined).mockRejectedValueOnce(err).mockResolvedValueOnce(undefined);

			await expect(service.deleteFile(user, 'f1', null)).resolves.toEqual({ deletedFiles: ['f1', 'thumb2'] });

			expect(uploadsStore.deleteById).toHaveBeenCalledWith('thumb2');
			expect(logError).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'thumb1', originalFileId: 'f1', err }));
		});

		it('propagates a failure to delete the original file and leaves its derivatives alone', async () => {
			jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf(['thumb1']) as any);
			const err = new Error('storage is down');
			uploadsStore.deleteById.mockRejectedValueOnce(err);

			await expect(service.deleteFile(user, 'f1', null)).rejects.toBe(err);

			expect(uploadsStore.deleteById).toHaveBeenCalledTimes(1);
		});
	});

	describe('deleteFile message consistency', () => {
		const removedMarker = { type: 'removed-file', color: '#FD745E', text: '_File_removed_' };

		it('drops the removed files and replaces only their attachments', async () => {
			jest.mocked(Uploads.findAllByOriginalFileId).mockReturnValue(cursorOf(['thumb1']) as any);
			const msg = {
				_id: 'm1',
				rid: 'r1',
				file: { _id: 'f1', name: 'removed.png', type: 'image/png' },
				files: [
					{ _id: 'f1', name: 'removed.png', type: 'image/png' },
					{ _id: 'f2', name: 'kept.png', type: 'image/png' },
				],
				attachments: [
					{ text: 'a quote' },
					{ type: 'file', fileId: 'f1', title: 'removed.png' },
					{ type: 'file', fileId: 'f2', title: 'kept.png' },
				],
			} as unknown as IMessage;

			await service.deleteFile(user, 'f1', msg);

			expect(updateMessage).toHaveBeenCalledWith(
				{
					...msg,
					files: [{ _id: 'f2', name: 'kept.png', type: 'image/png' }],
					attachments: [{ text: 'a quote' }, { ...removedMarker, fileId: 'f1' }, { type: 'file', fileId: 'f2', title: 'kept.png' }],
					file: { _id: 'f2', name: 'kept.png', type: 'image/png' },
				},
				user,
				msg,
			);
		});

		it('replaces a legacy file attachment that carries no fileId', async () => {
			const msg = {
				_id: 'm1',
				rid: 'r1',
				attachments: [{ type: 'file', title: 'legacy.png' }],
			} as unknown as IMessage;

			await service.deleteFile(user, 'f1', msg);

			expect(jest.mocked(updateMessage).mock.calls[0][0].attachments).toEqual([removedMarker]);
		});

		it('keeps the primary file when it is not one of the removed ones', async () => {
			const msg = {
				_id: 'm1',
				rid: 'r1',
				file: { _id: 'f3', name: 'kept.png', type: 'image/png' },
				files: [
					{ _id: 'f2', name: 'other.png', type: 'image/png' },
					{ _id: 'f3', name: 'kept.png', type: 'image/png' },
				],
			} as unknown as IMessage;

			await service.deleteFile(user, 'f1', msg);

			expect(jest.mocked(updateMessage).mock.calls[0][0].file).toEqual({ _id: 'f3', name: 'kept.png', type: 'image/png' });
		});
	});

	describe('getFileBuffer', () => {
		it('returns the buffer held by the storage', async () => {
			const buffer = Buffer.from('a file');
			jest.mocked(FileUpload.getBuffer).mockResolvedValue(buffer);

			await expect(service.getFileBuffer({ file: { _id: 'f1' } as IUpload })).resolves.toBe(buffer);
		});

		it('rejects when the storage answers with something that is not a buffer', async () => {
			jest.mocked(FileUpload.getBuffer).mockResolvedValue('a file' as any);

			await expect(service.getFileBuffer({ file: { _id: 'f1' } as IUpload })).rejects.toThrow('Unknown error');
		});
	});

	describe('streamUploadedFile', () => {
		const file = { _id: 'f1', type: 'image/png' } as IUpload;
		let image: Buffer;

		beforeAll(async () => {
			image = await sharp({ create: { width: 100, height: 50, channels: 3, background: 'red' } })
				.png()
				.toBuffer();
		});

		it('rejects when the storage has no readable stream for the file', async () => {
			uploadsStore._store.getReadStream.mockResolvedValue(undefined);

			await expect(service.streamUploadedFile({ file })).rejects.toThrow('error-file-not-found');
		});

		it('returns the stored stream untouched when resizing does not apply', async () => {
			const stream = Readable.from(image);
			uploadsStore._store.getReadStream.mockResolvedValue(stream);

			await expect(service.streamUploadedFile({ file })).resolves.toBe(stream);
			await expect(
				service.streamUploadedFile({ file: { ...file, type: 'text/plain' }, imageResizeOpts: { width: 10, height: 10 } }),
			).resolves.toBe(stream);

			expect(uploadsStore._store.getReadStream).toHaveBeenCalledWith('f1', file);
		});

		it('resizes an image into the requested box instead of cropping it', async () => {
			uploadsStore._store.getReadStream.mockResolvedValue(Readable.from(image));

			const resized = await buffer(await service.streamUploadedFile({ file, imageResizeOpts: { width: 32, height: 64 } }));

			const { width, height } = await sharp(resized).metadata();
			expect({ width, height }).toEqual({ width: 32, height: 64 });

			const [red, green, blue] = await sharp(resized).raw().toBuffer();
			expect([red, green, blue]).toEqual([0, 0, 0]);
		});

		it('hands a failure of the source stream to the transformation', async () => {
			const stream = new PassThrough();
			uploadsStore._store.getReadStream.mockResolvedValue(stream);

			const resized = await service.streamUploadedFile({ file, imageResizeOpts: { width: 32, height: 64 } });
			stream.destroy(new Error('read failed'));

			await expect(buffer(resized)).rejects.toThrow('read failed');
		});
	});

	describe('uploadFileFromStream', () => {
		const details = { name: 'a.png', type: 'image/png', rid: 'r1', userId: 'u1' };
		let tempDir: string;
		let tempFilePath: string;
		let streamParam: PassThrough;
		let createWriteStream: jest.SpyInstance<fs.WriteStream>;

		beforeEach(() => {
			tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-service-spec-'));
			tempFilePath = path.join(tempDir, 'upload');
			jest.mocked(UploadFS.getTempFilePath).mockReturnValue(tempFilePath);
			streamParam = new PassThrough();
			createWriteStream = jest.spyOn(fs, 'createWriteStream');
		});

		afterEach(() => {
			createWriteStream.mockRestore();
			fs.rmSync(tempDir, { recursive: true, force: true });
		});

		it('stores the temporary file holding everything the incoming stream wrote', async () => {
			const stored = { _id: 'f1' } as IUpload;
			uploadsStore.insert.mockResolvedValue(stored);

			const upload = service.uploadFileFromStream({ streamParam, details } as any);
			streamParam.end('a file');

			await expect(upload).resolves.toBe(stored);
			expect(uploadsStore.insert).toHaveBeenCalledWith({ ...details, size: 6 }, tempFilePath);
			expect(fs.readFileSync(tempFilePath, 'utf8')).toBe('a file');
		});

		it('removes the temporary file when the incoming stream fails', async () => {
			const upload = service.uploadFileFromStream({ streamParam, details } as any);
			const err = new Error('client hung up');
			streamParam.write('half of');
			streamParam.destroy(err);

			await expect(upload).rejects.toBe(err);
			expect(uploadsStore.insert).not.toHaveBeenCalled();
			expect(createWriteStream.mock.results[0].value.destroyed).toBe(true);
			await expect(waitForRemoval(tempFilePath)).resolves.toBe(false);
		});

		it('rejects when the temporary file cannot be written', async () => {
			jest.mocked(UploadFS.getTempFilePath).mockReturnValue(path.join(tempDir, 'missing', 'upload'));

			const upload = service.uploadFileFromStream({ streamParam, details } as any);
			streamParam.end('a file');

			await expect(upload).rejects.toThrow('ENOENT');
			expect(uploadsStore.insert).not.toHaveBeenCalled();
		});

		it('removes the temporary file when the storage refuses the upload', async () => {
			const err = new Error('quota exceeded');
			uploadsStore.insert.mockRejectedValue(err);

			const upload = service.uploadFileFromStream({ streamParam, details } as any);
			streamParam.end('a file');

			await expect(upload).rejects.toBe(err);
			await expect(waitForRemoval(tempFilePath)).resolves.toBe(false);
		});
	});

	describe('avatars', () => {
		it('delegates an avatar upload with the user, buffer, content type and service', async () => {
			const buffer = Buffer.from('an avatar');

			await service.setUserAvatar(user, buffer, 'image/png', 'rest');

			expect(setUserAvatar).toHaveBeenCalledWith(user, buffer, 'image/png', 'rest');
		});

		it('rejects an avatar reset for a user without a username', async () => {
			await expect(service.resetUserAvatar({ _id: 'u1' } as IUser)).rejects.toThrow('Username is required to reset avatar');

			expect(avatarsStore.deleteByName).not.toHaveBeenCalled();
			expect(Users.unsetAvatarData).not.toHaveBeenCalled();
			expect(api.broadcast).not.toHaveBeenCalled();
		});

		it('removes the stored avatar, clears its data and announces the update', async () => {
			await service.resetUserAvatar(user);

			expect(FileUpload.getStore).toHaveBeenCalledWith('Avatars');
			expect(avatarsStore.deleteByName).toHaveBeenCalledWith('jane');
			expect(Users.unsetAvatarData).toHaveBeenCalledWith('u1');
			expect(api.broadcast).toHaveBeenCalledWith('user.avatarUpdate', { username: 'jane', avatarETag: undefined });
		});
	});
});
