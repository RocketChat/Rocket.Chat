import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const countPendingByUserId = sinon.stub();
const insertOne = sinon.stub();
const findOneByIdAndUserId = sinon.stub();
const updatePendingById = sinon.stub();
const deletePendingByIdAndUserId = sinon.stub();
const canSendMessageAsync = sinon.stub();
const findOneById = sinon.stub();

const { scheduleMessage, updateScheduledMessage, cancelScheduledMessage } = proxyquire.noCallThru().load('./scheduledMessages', {
	'@rocket.chat/models': {
		Messages: { findOneById },
		ScheduledMessages: {
			countPendingByUserId,
			insertOne,
			findOneByIdAndUserId,
			updatePendingById,
			deletePendingByIdAndUserId,
		},
	},
	'@rocket.chat/random': { Random: { id: () => 'scheduled-id' } },
	'meteor/meteor': {
		Meteor: {
			Error: class MeteorError extends Error {
				public error: string;

				constructor(error: string, reason?: string) {
					super(reason ?? error);
					this.error = error;
				}
			},
		},
	},
	'../../../settings': { settings: { get: settingsGet } },
	'../../authorization/canSendMessage': { canSendMessageAsync },
});

const user = { _id: 'user-id', username: 'user' } as any;

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60 * 1000);

describe('scheduledMessages', () => {
	beforeEach(() => {
		sinon.reset();

		settingsGet.withArgs('Message_AllowScheduling').returns(true);
		settingsGet.withArgs('Message_MaxAllowedSize').returns(5000);
		settingsGet.withArgs('Message_MaxScheduledMessagesPerUser').returns(25);
		settingsGet.withArgs('Threads_enabled').returns(true);

		canSendMessageAsync.resolves({ _id: 'room-id' });
		countPendingByUserId.resolves(0);
		insertOne.resolves({ insertedId: 'scheduled-id' });
	});

	describe('scheduleMessage', () => {
		it('should persist a pending message for a valid future date', async () => {
			const scheduledAt = inMinutes(30);

			const result = await scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt });

			expect(insertOne.calledOnce).to.equal(true);
			expect(result).to.include({ uid: 'user-id', rid: 'room-id', msg: 'hello', status: 'scheduled' });
			expect(result.scheduledAt).to.equal(scheduledAt);
		});

		it('should reject dates less than a minute away', async () => {
			await expect(scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt: inMinutes(0.5) })).to.be.rejectedWith(
				'Messages must be scheduled at least one minute in the future',
			);
			expect(insertOne.called).to.equal(false);
		});

		it('should reject dates more than a year away', async () => {
			await expect(scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt: inMinutes(366 * 24 * 60) })).to.be.rejectedWith(
				'Messages cannot be scheduled more than a year in advance',
			);
			expect(insertOne.called).to.equal(false);
		});

		it('should reject empty messages', async () => {
			await expect(scheduleMessage(user, { rid: 'room-id', msg: '   ', scheduledAt: inMinutes(30) })).to.be.rejectedWith(
				'Cannot schedule an empty message',
			);
		});

		it('should reject when scheduling is disabled', async () => {
			settingsGet.withArgs('Message_AllowScheduling').returns(false);

			await expect(scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt: inMinutes(30) })).to.be.rejectedWith(
				'Message scheduling is disabled',
			);
		});

		it('should reject when the user reached the pending limit', async () => {
			countPendingByUserId.resolves(25);

			await expect(scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt: inMinutes(30) })).to.be.rejectedWith(
				'Maximum number of scheduled messages reached',
			);
		});

		it('should reject when the user cannot post in the room', async () => {
			canSendMessageAsync.rejects(new Error('error-not-allowed'));

			await expect(scheduleMessage(user, { rid: 'room-id', msg: 'hello', scheduledAt: inMinutes(30) })).to.be.rejectedWith(
				'error-not-allowed',
			);
			expect(insertOne.called).to.equal(false);
		});

		it('should resolve the room from the thread parent message', async () => {
			findOneById.resolves({ _id: 'thread-id', rid: 'thread-room-id' });
			canSendMessageAsync.resolves({ _id: 'thread-room-id' });

			const result = await scheduleMessage(user, {
				rid: 'room-id',
				msg: 'hello',
				scheduledAt: inMinutes(30),
				tmid: 'thread-id',
			});

			expect(canSendMessageAsync.calledWith('thread-room-id')).to.equal(true);
			expect(result.rid).to.equal('thread-room-id');
		});
	});

	describe('updateScheduledMessage', () => {
		it('should update a pending message', async () => {
			const scheduledAt = inMinutes(45);
			findOneByIdAndUserId.resolves({ _id: 'scheduled-id', rid: 'room-id', status: 'scheduled' });
			updatePendingById.resolves({ _id: 'scheduled-id', msg: 'updated', scheduledAt });

			const result = await updateScheduledMessage(user, 'scheduled-id', { msg: 'updated', scheduledAt });

			expect(result).to.include({ msg: 'updated' });
		});

		it('should reject when the message is no longer pending', async () => {
			findOneByIdAndUserId.resolves({ _id: 'scheduled-id', rid: 'room-id', status: 'sent' });

			await expect(updateScheduledMessage(user, 'scheduled-id', { msg: 'updated' })).to.be.rejectedWith(
				'This message is no longer pending',
			);
			expect(updatePendingById.called).to.equal(false);
		});

		it('should reject when the message belongs to another user', async () => {
			findOneByIdAndUserId.resolves(null);

			await expect(updateScheduledMessage(user, 'scheduled-id', { msg: 'updated' })).to.be.rejectedWith('Scheduled message not found');
		});
	});

	describe('cancelScheduledMessage', () => {
		it('should delete a pending message', async () => {
			deletePendingByIdAndUserId.resolves({ deletedCount: 1 });

			await cancelScheduledMessage('user-id', 'scheduled-id');

			expect(deletePendingByIdAndUserId.calledWith('scheduled-id', 'user-id')).to.equal(true);
		});

		it('should reject when nothing was deleted', async () => {
			deletePendingByIdAndUserId.resolves({ deletedCount: 0 });

			await expect(cancelScheduledMessage('user-id', 'scheduled-id')).to.be.rejectedWith('Scheduled message not found');
		});
	});
});
