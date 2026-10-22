import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IScheduledMessage, IUpload, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { sendSimpleMessage } from '../../data/chat.helper';
import { withDatabase } from '../../data/database.helper';
import { imgURL } from '../../data/interactions';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login, setUserActiveStatus } from '../../data/users.helper';

const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

const schedule = (creds: Credentials, body: Record<string, unknown>) => request.post(api('scheduledMessages.create')).set(creds).send(body);

const listMine = async (creds: Credentials, roomId?: string): Promise<IScheduledMessage[]> => {
	const res = await request
		.get(api('scheduledMessages.list'))
		.set(creds)
		.query({ ...(roomId && { roomId }) })
		.expect(200);
	return res.body.scheduledMessages;
};

describe('[Scheduled Messages]', () => {
	let user: IUser;
	let userCredentials: Credentials;
	let otherCredentials: Credentials;
	let other: IUser;
	let channel: IRoom;

	before((_t, done) => getCredentials(done));

	before(async () => {
		user = await createUser();
		other = await createUser();
		userCredentials = await login(user.username, password);
		otherCredentials = await login(other.username, password);
		channel = (await createRoom({ type: 'c', name: `scheduled-${Date.now()}`, members: [user.username as string] })).body.channel;
	});

	after(() => Promise.all([deleteRoom({ type: 'c', roomId: channel._id }), deleteUser(user), deleteUser(other)]));

	describe('[/scheduledMessages.create]', () => {
		it('stores a pending item that the owner can list in the room', async () => {
			const res = await schedule(userCredentials, { rid: channel._id, msg: 'see you at standup', scheduledAt: inOneHour() }).expect(200);

			expect(res.body.scheduledMessage).to.include({ rid: channel._id, msg: 'see you at standup', status: 'pending' });
			expect((await listMine(userCredentials, channel._id)).map(({ _id }) => _id)).to.include(res.body.scheduledMessage._id);
		});

		it('rejects a send time 30 seconds from now', async () => {
			const res = await schedule(userCredentials, {
				rid: channel._id,
				msg: 'too soon',
				scheduledAt: new Date(Date.now() + 30 * 1000).toISOString(),
			}).expect(400);

			expect(res.body).to.have.property('errorType', 'error-scheduled-message-time-out-of-range');
		});

		it('rejects a send time 121 days from now', async () => {
			const res = await schedule(userCredentials, {
				rid: channel._id,
				msg: 'too late',
				scheduledAt: new Date(Date.now() + 121 * 24 * 60 * 60 * 1000).toISOString(),
			}).expect(400);

			expect(res.body).to.have.property('errorType', 'error-scheduled-message-time-out-of-range');
		});

		it('rejects a send time that is not a date', async () => {
			await schedule(userCredentials, { rid: channel._id, msg: 'bad', scheduledAt: 'tomorrow' }).expect(400);
		});

		describe('when the setting is off', () => {
			before(() => updateSetting('Message_Scheduling_Enabled', false));
			after(() => updateSetting('Message_Scheduling_Enabled', true));

			it('rejects the request', async () => {
				const res = await schedule(userCredentials, { rid: channel._id, msg: 'off', scheduledAt: inOneHour() }).expect(400);

				expect(res.body).to.have.property('errorType', 'error-message-scheduling-disabled');
			});
		});

		describe('without the schedule-message permission', () => {
			before(() => updatePermission('schedule-message', ['admin']));
			after(() => updatePermission('schedule-message', ['admin', 'user']));

			it('rejects the request', async () => {
				const res = await schedule(userCredentials, { rid: channel._id, msg: 'no perm', scheduledAt: inOneHour() }).expect(400);

				expect(res.body).to.have.property('errorType', 'error-not-allowed');
			});
		});
	});

	describe('items of another user', () => {
		let item: IScheduledMessage;

		before(async () => {
			item = (await schedule(userCredentials, { rid: channel._id, msg: 'mine', scheduledAt: inOneHour() }).expect(200)).body
				.scheduledMessage;
		});

		it('are not in the list of the other user', async () => {
			expect((await listMine(otherCredentials)).map(({ _id }) => _id)).to.not.include(item._id);
		});

		(['update', 'sendNow', 'delete'] as const).forEach((route) => {
			it(`cannot be changed through ${route}`, async () => {
				const res = await request
					.post(api(`scheduledMessages.${route}`))
					.set(otherCredentials)
					.send({ scheduledMessageId: item._id, ...(route === 'update' && { msg: 'stolen' }) })
					.expect(400);

				expect(res.body).to.have.property('errorType', 'error-scheduled-message-not-found');
			});
		});
	});

	describe('[/scheduledMessages.update]', () => {
		it('changes the text and the send time', async () => {
			const created = (await schedule(userCredentials, { rid: channel._id, msg: 'draft', scheduledAt: inOneHour() }).expect(200)).body
				.scheduledMessage;
			const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

			const res = await request
				.post(api('scheduledMessages.update'))
				.set(userCredentials)
				.send({ scheduledMessageId: created._id, msg: 'final', scheduledAt: later })
				.expect(200);

			expect(res.body.scheduledMessage).to.include({ msg: 'final', scheduledAt: later, status: 'pending' });
		});
	});

	describe('[/scheduledMessages.sendNow]', () => {
		it('posts the message in the room and removes the item', async () => {
			const created = (await schedule(userCredentials, { rid: channel._id, msg: 'sent early', scheduledAt: inOneHour() }).expect(200)).body
				.scheduledMessage;

			const res = await request
				.post(api('scheduledMessages.sendNow'))
				.set(userCredentials)
				.send({ scheduledMessageId: created._id })
				.expect(200);

			expect(res.body.message).to.include({ rid: channel._id, msg: 'sent early' });
			expect(res.body.message.u).to.include({ _id: user._id });
			expect((await listMine(userCredentials, channel._id)).map(({ _id }) => _id)).to.not.include(created._id);
		});

		describe('after the user lost access to the room', () => {
			let group: IRoom;
			let created: IScheduledMessage;

			before(async () => {
				group = (await createRoom({ type: 'p', name: `scheduled-p-${Date.now()}`, members: [user.username as string] })).body.group;
				created = (await schedule(userCredentials, { rid: group._id, msg: 'not anymore', scheduledAt: inOneHour() }).expect(200)).body
					.scheduledMessage;
				await request.post(api('groups.kick')).set(credentials).send({ roomId: group._id, userId: user._id }).expect(200);
			});

			after(() => deleteRoom({ type: 'p', roomId: group._id }));

			it('fails, keeps the item as failed with a reason, and posts nothing', async () => {
				await request.post(api('scheduledMessages.sendNow')).set(userCredentials).send({ scheduledMessageId: created._id }).expect(400);

				const [failed] = (await listMine(userCredentials, group._id)).filter(({ _id }) => _id === created._id);
				expect(failed).to.have.property('status', 'failed');
				expect(failed).to.have.property('error').that.is.a('string').and.not.empty;

				const history = await request.get(api('groups.history')).set(credentials).query({ roomId: group._id }).expect(200);
				expect(history.body.messages.map(({ msg }: { msg: string }) => msg)).to.not.include('not anymore');
			});
		});
	});

	describe('with files', () => {
		const upload = async () => {
			const res = await request
				.post(api(`rooms.media/${channel._id}`))
				.set(userCredentials)
				.attach('file', imgURL)
				.expect(200);
			return { _id: res.body.file._id as string, name: '1024x1024.png' };
		};
		const findUpload = (_id: string) => withDatabase((db) => db.collection<IUpload>('rocketchat_uploads').findOne({ _id }));

		it('holds the attached file until the send time', async () => {
			const file = await upload();

			const res = await schedule(userCredentials, {
				rid: channel._id,
				msg: 'see attached',
				files: [file],
				scheduledAt: inOneHour(),
			}).expect(200);

			expect(res.body.scheduledMessage.files).to.deep.equal([{ ...file, type: 'image/png' }]);
			expect(await findUpload(file._id)).to.not.have.property('expiresAt');
		});

		it('posts the held file in the room with the text', async () => {
			const file = await upload();
			const created = (
				await schedule(userCredentials, { rid: channel._id, msg: 'see attached', files: [file], scheduledAt: inOneHour() }).expect(200)
			).body.scheduledMessage;

			const res = await request
				.post(api('scheduledMessages.sendNow'))
				.set(userCredentials)
				.send({ scheduledMessageId: created._id })
				.expect(200);

			expect(res.body.message).to.include({ rid: channel._id, msg: 'see attached' });
			expect(res.body.message.file).to.include({ _id: file._id });
		});

		it('posts a held file as a thread reply', async () => {
			const parent = (await sendSimpleMessage({ roomId: channel._id })).body.message;
			const file = await upload();
			const created = (
				await schedule(userCredentials, {
					rid: channel._id,
					tmid: parent._id,
					msg: 'in thread',
					files: [file],
					scheduledAt: inOneHour(),
				}).expect(200)
			).body.scheduledMessage;

			const res = await request
				.post(api('scheduledMessages.sendNow'))
				.set(userCredentials)
				.send({ scheduledMessageId: created._id })
				.expect(200);

			expect(res.body.message).to.include({ tmid: parent._id, msg: 'in thread' });
		});

		it('deletes the held file together with the item', async () => {
			const file = await upload();
			const created = (await schedule(userCredentials, { rid: channel._id, msg: '', files: [file], scheduledAt: inOneHour() }).expect(200))
				.body.scheduledMessage;

			await request.post(api('scheduledMessages.delete')).set(userCredentials).send({ scheduledMessageId: created._id }).expect(200);

			expect(await findUpload(file._id)).to.equal(null);
		});

		it('holds a file added while editing and deletes the one removed', async () => {
			const [removed, added] = [await upload(), await upload()];
			const created = (
				await schedule(userCredentials, { rid: channel._id, msg: 'v1', files: [removed], scheduledAt: inOneHour() }).expect(200)
			).body.scheduledMessage;

			const res = await request
				.post(api('scheduledMessages.update'))
				.set(userCredentials)
				.send({ scheduledMessageId: created._id, files: [added] })
				.expect(200);

			expect(res.body.scheduledMessage.files.map(({ _id }: { _id: string }) => _id)).to.deep.equal([added._id]);
			expect(await findUpload(removed._id)).to.equal(null);
			expect(await findUpload(added._id)).to.not.have.property('expiresAt');
		});
	});

	describe('[/scheduledMessages.delete]', () => {
		it('removes the item', async () => {
			const created = (await schedule(userCredentials, { rid: channel._id, msg: 'never', scheduledAt: inOneHour() }).expect(200)).body
				.scheduledMessage;

			await request.post(api('scheduledMessages.delete')).set(userCredentials).send({ scheduledMessageId: created._id }).expect(200);

			expect((await listMine(userCredentials, channel._id)).map(({ _id }) => _id)).to.not.include(created._id);
		});
	});

	describe('cleanup', () => {
		it('deletes the items of a room when the room is deleted', async () => {
			const room = (await createRoom({ type: 'c', name: `scheduled-gone-${Date.now()}`, members: [user.username as string] })).body.channel;
			await schedule(userCredentials, { rid: room._id, msg: 'room goes away', scheduledAt: inOneHour() }).expect(200);

			await deleteRoom({ type: 'c', roomId: room._id });

			expect(await listMine(userCredentials, room._id)).to.have.lengthOf(0);
		});

		it('deletes the items of a user when an admin deactivates that user', async () => {
			const leaver = await createUser();
			const leaverCredentials = await login(leaver.username, password);
			await schedule(leaverCredentials, { rid: channel._id, msg: 'user goes away', scheduledAt: inOneHour() }).expect(200);

			await setUserActiveStatus(leaver._id, false);
			await setUserActiveStatus(leaver._id, true);

			expect(await listMine(await login(leaver.username, password))).to.have.lengthOf(0);
			await deleteUser(leaver);
		});
	});
});
