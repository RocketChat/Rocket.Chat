import { api } from '@rocket.chat/core-services';
import type { IScheduledMessage } from '@rocket.chat/core-typings';
import type { IMessagesModel, IScheduledMessagesModel, IUploadsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ScheduledMessageService } from './service';
import { settings } from '../../settings';

const settingValues: Record<string, unknown> = {};
const cron = { add: jest.fn(), addAtTimestamp: jest.fn(), remove: jest.fn() };
const model = {
	findNextDueDate: jest.fn(),
	countByUserId: jest.fn(),
	insertOne: jest.fn(),
	findOneByIdAndUserId: jest.fn(),
	updateEditableByIdAndUserId: jest.fn(),
	deleteEditableByIdAndUserId: jest.fn(),
	findStaleSending: jest.fn(),
	findAll: jest.fn(),
	removeById: jest.fn(),
};
const hasPermission = jest.fn();
const canSendMessage = jest.fn();
const findMessageById = jest.fn();
const findUpload = jest.fn();
const confirmTemporaryFile = jest.fn();
const deleteHeldFiles = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	api: { broadcast: jest.fn() },
}));
jest.mock('@rocket.chat/cron', () => ({
	get cronJobs() {
		return cron;
	},
}));
jest.mock('../../settings', () => ({
	settings: { get: (key: string) => settingValues[key], watch: jest.fn() },
}));
jest.mock('../../lib/authorization/hasPermission', () => ({
	hasPermissionAsync: (...args: unknown[]) => hasPermission(...args),
}));
jest.mock('../../lib/authorization/canSendMessage', () => ({
	canSendMessageAsync: (...args: unknown[]) => canSendMessage(...args),
}));
jest.mock('./deliverScheduledMessage', () => ({ deliverScheduledMessage: jest.fn() }));
jest.mock('./heldFiles', () => ({ deleteHeldFiles: (...args: unknown[]) => deleteHeldFiles(...args) }));

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000);

describe('ScheduledMessageService', () => {
	let service: ScheduledMessageService;

	beforeAll(() => {
		registerModel('IScheduledMessagesModel', model as unknown as IScheduledMessagesModel);
		registerModel('IUsersModel', {
			findOneById: async (_id: string) => ({ _id, username: 'alice', name: 'Alice', type: 'user' }),
		} as unknown as IUsersModel);
		registerModel('IMessagesModel', { findOneById: (...args: unknown[]) => findMessageById(...args) } as unknown as IMessagesModel);
		registerModel('IUploadsModel', {
			findOneByIdAndUserIdAndRoomId: (...args: unknown[]) => findUpload(...args),
			confirmTemporaryFile: (...args: unknown[]) => confirmTemporaryFile(...args),
		} as unknown as IUploadsModel);
	});

	beforeEach(() => {
		jest.resetAllMocks();
		settingValues.Message_Scheduling_Enabled = true;
		settingValues.Message_MaxAllowedSize = 5000;
		hasPermission.mockResolvedValue(true);
		canSendMessage.mockResolvedValue({ _id: 'r1' });
		service = new ScheduledMessageService();
	});

	it('registers a recurring job that recovers due items when the timestamp job is lost', async () => {
		await service.started();

		expect(cron.add).toHaveBeenCalledWith('scheduled-messages-watchdog', expect.any(String), expect.any(Function));
	});

	it('deletes every scheduled message and its held files when the feature is turned off', async () => {
		const files = [{ _id: 'f1', name: 'a.png' }];
		model.findAll.mockReturnValue([
			{ _id: 's1', u: { _id: 'u1' }, files },
			{ _id: 's2', u: { _id: 'u2' } },
		]);
		const [, turned] = (settings.watch as jest.Mock).mock.calls.find(([id]) => id === 'Message_Scheduling_Enabled');

		await turned(false);

		expect(model.removeById.mock.calls).toEqual([['s1'], ['s2']]);
		expect(deleteHeldFiles).toHaveBeenCalledWith(files);
		expect((api.broadcast as jest.Mock).mock.calls).toEqual([
			['notify.scheduledMessage', 'u1'],
			['notify.scheduledMessage', 'u2'],
		]);
	});

	it('keeps the scheduled messages when the feature is turned on', async () => {
		model.findAll.mockReturnValue([{ _id: 's1', u: { _id: 'u1' } }]);
		const [, turned] = (settings.watch as jest.Mock).mock.calls.find(([id]) => id === 'Message_Scheduling_Enabled');

		await turned(true);

		expect(model.removeById).not.toHaveBeenCalled();
	});

	describe('scheduleNext', () => {
		it('schedules the next job even when processing fails', async () => {
			model.findNextDueDate.mockResolvedValue(inOneHour());
			await service.scheduleNext();
			const runJob = cron.addAtTimestamp.mock.calls[0][2];
			cron.addAtTimestamp.mockClear();
			model.findStaleSending.mockImplementation(() => {
				throw new Error('primary stepped down');
			});

			await expect(runJob()).rejects.toThrow('primary stepped down');

			expect(cron.addAtTimestamp).toHaveBeenCalledWith('scheduled-messages', expect.any(Date), expect.any(Function));
		});

		it('replaces the job with one at the next due time', async () => {
			const next = inOneHour();
			model.findNextDueDate.mockResolvedValue(next);

			await service.scheduleNext();

			expect(cron.remove).toHaveBeenCalledWith('scheduled-messages');
			expect(cron.addAtTimestamp).toHaveBeenCalledWith('scheduled-messages', next, expect.any(Function));
			expect(cron.remove.mock.invocationCallOrder[0]).toBeLessThan(cron.addAtTimestamp.mock.invocationCallOrder[0]);
		});

		it('leaves no job when nothing is pending', async () => {
			model.findNextDueDate.mockResolvedValue(undefined);

			await service.scheduleNext();

			expect(cron.remove).toHaveBeenCalledWith('scheduled-messages');
			expect(cron.addAtTimestamp).not.toHaveBeenCalled();
		});

		it('leaves no job when the setting is off', async () => {
			settingValues.Message_Scheduling_Enabled = false;
			model.findNextDueDate.mockResolvedValue(inOneHour());

			await service.scheduleNext();

			expect(cron.addAtTimestamp).not.toHaveBeenCalled();
		});
	});

	describe('create', () => {
		it('refuses a message with no text and no files', async () => {
			model.countByUserId.mockResolvedValue(0);

			await expect(service.create('u1', { rid: 'r1', msg: '', scheduledAt: inOneHour() })).rejects.toThrow('error-invalid-message');
			expect(model.insertOne).not.toHaveBeenCalled();
		});

		it('refuses a new item when the user is at the limit', async () => {
			model.countByUserId.mockResolvedValue(100);

			await expect(service.create('u1', { rid: 'r1', msg: 'hi', scheduledAt: inOneHour() })).rejects.toThrow(
				'error-scheduled-messages-limit-reached',
			);
			expect(model.insertOne).not.toHaveBeenCalled();
		});

		it('refuses plain text in an encrypted room that requires encryption', async () => {
			settingValues.E2E_Enable = true;
			settingValues.E2E_Allow_Unencrypted_Messages = false;
			canSendMessage.mockResolvedValue({ _id: 'r1', encrypted: true });
			model.countByUserId.mockResolvedValue(0);

			await expect(service.create('u1', { rid: 'r1', msg: 'hi', scheduledAt: inOneHour() })).rejects.toThrow('error-not-allowed');
			expect(model.insertOne).not.toHaveBeenCalled();
		});

		it('keeps the room name, so the list can still name a room the author left', async () => {
			canSendMessage.mockResolvedValue({ _id: 'r1', t: 'p', name: 'release-team', fname: 'Release team' });
			model.countByUserId.mockResolvedValue(0);
			model.insertOne.mockResolvedValue({ insertedId: 's1' });

			await service.create('u1', { rid: 'r1', msg: 'hi', scheduledAt: inOneHour() });

			expect(model.insertOne).toHaveBeenCalledWith(expect.objectContaining({ roomName: 'Release team', roomType: 'p' }));
		});

		it('holds each attached file, so the temporary upload cleanup keeps it until the send time', async () => {
			model.countByUserId.mockResolvedValue(0);
			model.insertOne.mockResolvedValue({ insertedId: 's1' });
			findUpload.mockImplementation(async (_id: string) => ({ _id, type: 'image/png' }));

			await service.create('u1', { rid: 'r1', msg: '', files: [{ _id: 'f1', name: 'a.png' }], scheduledAt: inOneHour() });

			expect(confirmTemporaryFile).toHaveBeenCalledWith('f1', 'u1');
			expect(model.insertOne).toHaveBeenCalledWith(expect.objectContaining({ files: [{ _id: 'f1', name: 'a.png', type: 'image/png' }] }));
		});

		it('refuses a file that is not the author upload in this room', async () => {
			model.countByUserId.mockResolvedValue(0);
			findUpload.mockResolvedValue(null);

			await expect(
				service.create('u1', { rid: 'r1', msg: '', files: [{ _id: 'f1', name: 'a.png' }], scheduledAt: inOneHour() }),
			).rejects.toThrow('invalid-file');
			expect(model.insertOne).not.toHaveBeenCalled();
		});

		it('refuses a thread reply whose parent message is in another room', async () => {
			model.countByUserId.mockResolvedValue(0);
			findMessageById.mockResolvedValue({ _id: 'parent', rid: 'other-room' });

			await expect(service.create('u1', { rid: 'r1', tmid: 'parent', msg: 'hi', scheduledAt: inOneHour() })).rejects.toThrow(
				'error-invalid-message',
			);
			expect(model.insertOne).not.toHaveBeenCalled();
		});
	});

	describe('update and delete', () => {
		const item = { _id: 's1', rid: 'r1', u: { _id: 'u1' }, status: 'sending' } as IScheduledMessage;

		it('does not change an item that is being sent, and lets go of the files it just held', async () => {
			const added = { _id: 'f9', name: 'late.png' };
			model.findOneByIdAndUserId.mockResolvedValue(item);
			model.updateEditableByIdAndUserId.mockResolvedValue(null);
			findUpload.mockResolvedValue({ _id: 'f9' });

			await expect(service.update('u1', 's1', { msg: 'changed', files: [added] })).rejects.toThrow('error-scheduled-message-not-found');
			expect(deleteHeldFiles).toHaveBeenCalledWith([added]);
		});

		it('keeps the held files when only the text changes', async () => {
			model.findOneByIdAndUserId.mockResolvedValue({ ...item, status: 'pending', msg: 'hi', files: [{ _id: 'f1', name: 'a.png' }] });
			model.updateEditableByIdAndUserId.mockImplementation(async (_id, _uid, set) => ({ ...item, ...set }));

			await service.update('u1', 's1', { msg: 'changed' });

			expect(deleteHeldFiles.mock.calls.flat(2)).toHaveLength(0);
		});

		it('holds the files added while editing and deletes the ones removed', async () => {
			const kept = { _id: 'f1', name: 'a.png', type: 'image/png' };
			const removed = { _id: 'f2', name: 'b.pdf' };
			model.findOneByIdAndUserId.mockResolvedValue({ ...item, status: 'pending', msg: 'hi', files: [kept, removed] });
			model.updateEditableByIdAndUserId.mockImplementation(async (_id, _uid, set) => ({ ...item, ...set }));
			findUpload.mockResolvedValue({ _id: 'f3', type: 'text/plain' });

			await service.update('u1', 's1', {
				files: [
					{ _id: 'f1', name: 'a.png' },
					{ _id: 'f3', name: 'c.txt' },
				],
			});

			expect(confirmTemporaryFile).toHaveBeenCalledWith('f3', 'u1');
			expect(model.updateEditableByIdAndUserId).toHaveBeenCalledWith('s1', 'u1', {
				files: [kept, { _id: 'f3', name: 'c.txt', type: 'text/plain' }],
			});
			expect(deleteHeldFiles).toHaveBeenCalledWith([removed]);
		});

		it('refuses an edit that leaves no text and no files', async () => {
			model.findOneByIdAndUserId.mockResolvedValue({ ...item, status: 'pending', msg: '', files: [{ _id: 'f1', name: 'a.png' }] });

			await expect(service.update('u1', 's1', { files: [] })).rejects.toThrow('error-invalid-message');
			expect(deleteHeldFiles).not.toHaveBeenCalled();
		});

		it('deletes the held files together with the item', async () => {
			const files = [{ _id: 'f1', name: 'a.png' }];
			model.findOneByIdAndUserId.mockResolvedValue({ _id: 's1', rid: 'r1', files });
			model.deleteEditableByIdAndUserId.mockResolvedValue({ deletedCount: 1 });

			await service.delete('u1', 's1');

			expect(deleteHeldFiles).toHaveBeenCalledWith(files);
		});

		it('does not delete an item that is being sent', async () => {
			model.deleteEditableByIdAndUserId.mockResolvedValue({ deletedCount: 0 });

			await expect(service.delete('u1', 's1')).rejects.toThrow('error-scheduled-message-not-found');
		});
	});
});
