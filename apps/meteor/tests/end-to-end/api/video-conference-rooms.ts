import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser, IVideoConferenceRoom, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { api, credentials, getCredentials, request } from '../../data/api-data';
import { withDatabase } from '../../data/database.helper';
import { getSettingValueById, restorePermissionToRoles, updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

// The server never contacts the SFU on these paths, so placeholder values are enough to register the provider.
const nativeProviderSettings = {
	VideoConf_LiveKit_Enabled: true,
	VideoConf_LiveKit_Url: 'wss://livekit.invalid',
	VideoConf_LiveKit_Api_Key: 'api-key',
	VideoConf_LiveKit_Api_Secret: 'api-secret',
	VideoConf_Conference_Window_Enabled: true,
	VideoConf_Default_Provider: 'livekit',
} as const;

const run = Date.now().toString(36);

const waitForNativeProvider = async () => {
	for (let attempt = 0; attempt < 50; attempt++) {
		const res = await request.get(api('video-conference.capabilities')).set(credentials);
		if (res.body.providerName === 'livekit') {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}
	throw new Error('the native provider did not register');
};

const createLink = (roomId: IRoom['_id'], title: string, creds: Credentials = credentials) =>
	request.post(api('video-conference.rooms.create')).set(creds).send({ roomId, title });
const renameLink = (conferenceRoomId: string, title: string, creds: Credentials = credentials) =>
	request.post(api('video-conference.rooms.rename')).set(creds).send({ conferenceRoomId, title });
const deleteLink = (conferenceRoomId: string, creds: Credentials = credentials) =>
	request.post(api('video-conference.rooms.delete')).set(creds).send({ conferenceRoomId });
const listLinks = (roomId: IRoom['_id'], creds: Credentials = credentials) =>
	request.get(api('video-conference.rooms.list')).set(creds).query({ roomId });
const info = (callId: string, creds: Credentials = credentials) => request.get(api('video-conference.info')).set(creds).query({ callId });
const start = (body: Record<string, unknown>, creds: Credentials = credentials) =>
	request.post(api('video-conference.start')).set(creds).send(body);

const createdLink = async (roomId: IRoom['_id'], title: string): Promise<IVideoConferenceRoom> => {
	const res = await createLink(roomId, title).expect(200);
	return res.body.room;
};

const startedCallId = async (roomId: IRoom['_id'], customUrl?: string): Promise<string> => {
	const res = await start({ roomId, ...(customUrl && { customUrl }) }).expect(200);
	return res.body.data.callId;
};

// Leaving waits a grace period before it ends a conference; the tests only need it over.
const endConference = (callId: string) =>
	withDatabase((db) =>
		db
			.collection<VideoConference>('rocketchat_video_conference')
			.updateOne({ _id: callId }, { $set: { status: VideoConferenceStatus.ENDED, endedAt: new Date() } }),
	);

const countLiveConferencesOfLink = (conferenceRoomId: string) =>
	withDatabase((db) =>
		db.collection('rocketchat_video_conference').countDocuments({
			conferenceRoomId,
			status: { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] },
		}),
	);

(IS_EE ? describe : describe.skip)('[Video Conference persistent links]', () => {
	let originalSettings: [string, unknown][] = [];
	let member: TestUser<IUser>;
	let stranger: TestUser<IUser>;
	let memberCredentials: Credentials;
	let strangerCredentials: Credentials;
	let groupId: IRoom['_id'];
	let otherGroupId: IRoom['_id'];
	const liveCalls: string[] = [];

	before((_t, done) => getCredentials(done));

	before(async () => {
		originalSettings = await Promise.all(
			Object.keys(nativeProviderSettings).map(async (id) => [id, await getSettingValueById(id)] as [string, unknown]),
		);
		for (const [id, value] of Object.entries(nativeProviderSettings)) {
			await updateSetting(id, value);
		}
		await waitForNativeProvider();

		member = await createUser();
		stranger = await createUser();
		memberCredentials = await login(member.username, password);
		strangerCredentials = await login(stranger.username, password);

		groupId = (await createRoom({ type: 'p', name: `pcl-${run}`, members: [member.username] })).body.group._id;
		otherGroupId = (await createRoom({ type: 'p', name: `pcl-other-${run}`, members: [member.username] })).body.group._id;
	});

	after(async () => {
		await Promise.all(liveCalls.map(endConference));
		await restorePermissionToRoles('call-management');
		await Promise.all([deleteRoom({ type: 'p', roomId: groupId }), deleteRoom({ type: 'p', roomId: otherGroupId })]);
		await Promise.all([deleteUser(member), deleteUser(stranger)]);
		for (const [id, value] of originalSettings) {
			await updateSetting(id, value as never);
		}
	});

	describe('[/video-conference.rooms.create]', () => {
		it('A1 answers the stored link', async () => {
			const res = await createLink(groupId, `${run} Planning`).expect(200);

			expect(res.body.success).to.be.true;
			expect(res.body.room).to.include({ rid: groupId, providerName: 'livekit', title: `${run} Planning`, url: `${run}-planning` });
			expect(res.body.room).to.have.all.keys('_id', 'rid', 'providerName', 'title', 'url', 'createdBy', 'createdAt', '_updatedAt');
			expect(res.body.room.createdBy).to.include({ username: 'rocketchat.internal.admin.test' });
		});

		it('A2 appends the lowest free suffix to a taken address', async () => {
			const urls = [];
			for (let i = 0; i < 3; i++) {
				urls.push((await createdLink(groupId, `${run} Standup`)).url);
			}
			expect(urls).to.deep.equal([`${run}-standup`, `${run}-standup-2`, `${run}-standup-3`]);

			// An address shaped like a conference id, or the one that opens a new conference, is never a link's.
			const callIdShaped = `${run}`.padEnd(24, '0').replace(/[^0-9a-f]/g, 'a');
			const shaped = await createdLink(groupId, callIdShaped);
			expect(shaped.url)
				.to.not.equal(callIdShaped)
				.and.to.match(new RegExp(`^${callIdShaped}-\\d+$`));
			const reserved = await createdLink(groupId, 'new');
			expect(reserved.url)
				.to.not.equal('new')
				.and.to.match(/^new-\d+$/);
		});

		it('A3 refuses a title with no address, and an invalid body', async () => {
			const res = await createLink(groupId, '!!!').expect(400);
			expect(res.body.error).to.equal('error-invalid-title');

			for (const body of [{ roomId: groupId }, { roomId: groupId, title: '' }, { roomId: groupId, title: 'a'.repeat(201) }]) {
				const invalid = await request.post(api('video-conference.rooms.create')).set(credentials).send(body).expect(400);
				expect(invalid.body.errorType).to.equal('invalid-params');
			}
		});

		it('A4 takes call-management, global or room-scoped', async () => {
			try {
				await updatePermission('call-management', ['admin']);
				await createLink(groupId, `${run} global role`).expect(200);
				await createLink(groupId, `${run} member`, memberCredentials).expect(403);

				await updatePermission('call-management', ['owner']);
				await createLink(groupId, `${run} owner role`).expect(200);
				await createLink(groupId, `${run} member`, memberCredentials).expect(403);
			} finally {
				await restorePermissionToRoles('call-management');
			}
		});

		it('A6 refuses a room the caller may not post in', async () => {
			const readOnly = (await createRoom({ type: 'p', name: `pcl-ro-${run}`, members: [member.username], readOnly: true })).body.group;
			try {
				await createLink(readOnly._id, `${run} read only`, memberCredentials).expect(403);
			} finally {
				await deleteRoom({ type: 'p', roomId: readOnly._id });
			}
		});
	});

	describe('[/video-conference.rooms.rename]', () => {
		it('A7 renames and re-addresses the link', async () => {
			const link = await createdLink(groupId, `${run} Retro`);
			await createdLink(groupId, `${run} Review`);

			const renamed = await renameLink(link._id, `${run} Demo`).expect(200);
			expect(renamed.body.room).to.include({ _id: link._id, title: `${run} Demo`, url: `${run}-demo` });

			const sameSlug = await renameLink(link._id, `${run} DEMO`).expect(200);
			expect(sameSlug.body.room).to.include({ title: `${run} DEMO`, url: `${run}-demo` });

			const clash = await renameLink(link._id, `${run} Review`).expect(200);
			expect(clash.body.room.url).to.equal(`${run}-review-2`);

			const unknown = await renameLink('unknown-link', `${run} Nope`).expect(400);
			expect(unknown.body.error).to.equal('error-invalid-conference-room');

			try {
				await updatePermission('call-management', ['admin', 'owner']);
				await renameLink(link._id, `${run} Member`, memberCredentials).expect(403);
			} finally {
				await restorePermissionToRoles('call-management');
			}
			const list = await listLinks(groupId).expect(200);
			expect(list.body.rooms.find(({ _id }: IVideoConferenceRoom) => _id === link._id)).to.include({ title: `${run} Review` });
		});
	});

	describe('[/video-conference.rooms.delete]', () => {
		it('A8 removes the link', async () => {
			const link = await createdLink(groupId, `${run} Removed`);

			try {
				await updatePermission('call-management', ['admin', 'owner']);
				await deleteLink(link._id, memberCredentials).expect(403);
			} finally {
				await restorePermissionToRoles('call-management');
			}
			await info(link.url).expect(200);

			const res = await deleteLink(link._id).expect(200);
			expect(res.body).to.deep.equal({ success: true });

			const list = await listLinks(groupId).expect(200);
			expect(list.body.rooms.map(({ _id }: IVideoConferenceRoom) => _id)).to.not.include(link._id);
			await info(link.url).expect(400);

			const unknown = await deleteLink(link._id).expect(400);
			expect(unknown.body.error).to.equal('error-invalid-conference-room');
		});
	});

	describe('[/video-conference.rooms.list]', () => {
		it('A9 lists the links oldest first, marking the live one', async () => {
			const idle = await createdLink(otherGroupId, `${run} Idle`);
			const busy = await createdLink(otherGroupId, `${run} Busy`);
			const callId = await startedCallId(otherGroupId, busy.url);
			liveCalls.push(callId);

			const res = await listLinks(otherGroupId).expect(200);

			expect(res.body.success).to.be.true;
			const ids = res.body.rooms.map(({ _id }: IVideoConferenceRoom) => _id);
			expect(ids.indexOf(idle._id)).to.be.lessThan(ids.indexOf(busy._id));
			const listed = (id: string) => res.body.rooms.find(({ _id }: IVideoConferenceRoom) => _id === id);
			expect(listed(busy._id)).to.include({ ongoingCallId: callId });
			expect(listed(idle._id)).to.not.have.property('ongoingCallId');

			const missing = await request.get(api('video-conference.rooms.list')).set(credentials).expect(400);
			expect(missing.body.errorType).to.equal('error-invalid-params');
		});
	});

	describe('access', () => {
		// The stranger holds call-management through the default user role; only room access keeps them out.
		it('A5 refuses a non-member', async () => {
			const link = await createdLink(groupId, `${run} Private`);

			await createLink(groupId, `${run} Stranger`, strangerCredentials).expect(403);
			await renameLink(link._id, `${run} Stranger`, strangerCredentials).expect(403);
			await deleteLink(link._id, strangerCredentials).expect(403);
			await listLinks(groupId, strangerCredentials).expect(403);

			const list = await listLinks(groupId).expect(200);
			expect(list.body.rooms.find(({ _id }: IVideoConferenceRoom) => _id === link._id)).to.include({ title: link.title, url: link.url });
		});

		it('A27 refuses a caller without credentials', async () => {
			await request.post(api('video-conference.rooms.create')).send({ roomId: groupId, title: 'x' }).expect(401);
			await request.post(api('video-conference.rooms.rename')).send({ conferenceRoomId: 'x', title: 'x' }).expect(401);
			await request.post(api('video-conference.rooms.delete')).send({ conferenceRoomId: 'x' }).expect(401);
			await request.get(api('video-conference.rooms.list')).query({ roomId: groupId }).expect(401);
		});
	});

	describe('[/video-conference.info]', () => {
		it('A10 answers a conference by its id as before', async () => {
			const callId = await startedCallId(groupId);
			liveCalls.push(callId);

			const res = await info(callId).expect(200);

			expect(res.body).to.include({ _id: callId, rid: groupId });
			expect(res.body).to.have.property('capabilities');
			expect(res.body.chatAccess).to.include({ rid: groupId });
			expect(res.body).to.not.have.property('canStart');
			expect(res.body).to.not.have.property('conferenceRoomId');
			expect(res.body).to.not.have.property('customUrl');
			expect(res.body.status).to.not.equal(VideoConferenceStatus.NOT_STARTED);
		});

		it("A11 answers a link's live conference by the link's address", async () => {
			const link = await createdLink(groupId, `${run} Live`);
			const callId = await startedCallId(groupId, link.url);
			liveCalls.push(callId);

			const res = await info(link.url).expect(200);

			expect(res.body).to.include({ _id: callId, customUrl: link.url, conferenceRoomId: link._id });
			expect(res.body.status).to.equal(VideoConferenceStatus.STARTED);
			expect(res.body).to.not.have.property('canStart');
		});

		it('A12 answers a link with nothing live as a conference not started', async () => {
			const link = await createdLink(groupId, `${run} Later`);

			const res = await info(link.url).expect(200);

			expect(res.body).to.include({
				_id: link._id,
				status: VideoConferenceStatus.NOT_STARTED,
				conferenceRoomId: link._id,
				customUrl: link.url,
				title: link.title,
				rid: groupId,
				providerName: 'livekit',
				anonymousUsers: 0,
				canStart: true,
			});
			expect(res.body.users).to.deep.equal([]);
			expect(res.body.messages).to.deep.equal({});
			expect(res.body).to.have.property('capabilities');
			expect(res.body.chatAccess).to.include({ rid: groupId });
			expect(res.body.chatAccess.membersWithoutAccess).to.deep.equal([]);

			try {
				await updatePermission('call-management', ['admin', 'owner']);
				const memberView = await info(link.url, memberCredentials).expect(200);
				expect(memberView.body).to.have.property('canStart', false);
			} finally {
				await restorePermissionToRoles('call-management');
			}
		});

		it('A13 keeps the old address of a renamed link on its conference until that ends', async () => {
			const link = await createdLink(groupId, `${run} Moving`);
			const callId = await startedCallId(groupId, link.url);

			const renamed = (await renameLink(link._id, `${run} Moved`).expect(200)).body.room;

			expect((await info(link.url).expect(200)).body._id).to.equal(callId);
			await endConference(callId);

			const gone = await info(link.url).expect(400);
			expect(gone.body.error).to.equal('invalid-params');
			expect((await info(renamed.url).expect(200)).body.status).to.equal(VideoConferenceStatus.NOT_STARTED);
		});

		it('A14 answers the same 400 to an unknown address and to a stranger', async () => {
			const link = await createdLink(groupId, `${run} Hidden`);
			const callId = await startedCallId(groupId);
			liveCalls.push(callId);
			const live = await createdLink(groupId, `${run} Hidden live`);
			liveCalls.push(await startedCallId(groupId, live.url));

			for (const [address, creds] of [
				['no-such-address', credentials],
				[link.url, strangerCredentials],
				[live.url, strangerCredentials],
				[callId, strangerCredentials],
			] as const) {
				const res = await info(address, creds).expect(400);
				expect(res.body.error).to.equal('invalid-params');
			}
		});
	});

	describe('[/video-conference.start]', () => {
		it('A15 starts as before without a link', async () => {
			const res = await start({ roomId: groupId }).expect(200);
			liveCalls.push(res.body.data.callId);

			expect(res.body.data).to.have.all.keys('type', 'callId', 'rid', 'providerName');
			expect(res.body.data).to.include({ type: 'videoconference', rid: groupId, providerName: 'livekit' });
			const conference = (await info(res.body.data.callId).expect(200)).body;
			expect(conference).to.not.have.property('conferenceRoomId');
			expect(conference).to.not.have.property('customUrl');
		});

		it("A16 A17 starts the link's conference once", async () => {
			const link = await createdLink(groupId, `${run} Kickoff`);

			const first = await start({ roomId: groupId, title: 'Ignored', customUrl: link.url }).expect(200);
			const { callId } = first.body.data;
			liveCalls.push(callId);

			const conference = (await info(callId).expect(200)).body;
			expect(conference).to.include({ title: link.title, conferenceRoomId: link._id, customUrl: link.url });

			const messagesAfterFirst = await withDatabase((db) =>
				db.collection('rocketchat_message').countDocuments({ rid: groupId, t: 'videoconf' }),
			);
			const second = await start({ roomId: groupId, customUrl: link.url }).expect(200);
			expect(second.body.data.callId).to.equal(callId);
			const messagesAfterSecond = await withDatabase((db) =>
				db.collection('rocketchat_message').countDocuments({ rid: groupId, t: 'videoconf' }),
			);
			expect(messagesAfterSecond).to.equal(messagesAfterFirst);
			expect(conference.messages.started).to.be.a('string');
		});

		it('A18 converges concurrent starts on one conference', async () => {
			const link = await createdLink(groupId, `${run} Race`);

			const [a, b] = await Promise.all([start({ roomId: groupId, customUrl: link.url }), start({ roomId: groupId, customUrl: link.url })]);

			expect(a.status).to.equal(200);
			expect(b.status).to.equal(200);
			expect(a.body.data.callId).to.equal(b.body.data.callId);
			liveCalls.push(a.body.data.callId);
			expect(await countLiveConferencesOfLink(link._id)).to.equal(1);
		});

		it('A19 refuses a link of another room or an unknown one, and a caller without permission', async () => {
			const foreign = await createdLink(otherGroupId, `${run} Foreign`);

			for (const customUrl of [foreign.url, 'no-such-link']) {
				const res = await start({ roomId: groupId, customUrl }).expect(400);
				expect(res.body.error).to.equal('error-invalid-conference-room');
			}
			expect(await countLiveConferencesOfLink(foreign._id)).to.equal(0);

			try {
				await updatePermission('call-management', ['admin', 'owner']);
				await start({ roomId: groupId, customUrl: foreign.url }, memberCredentials).expect(403);
			} finally {
				await restorePermissionToRoles('call-management');
			}
		});

		// The unique link index must not treat conferences without a link as clashing with each other.
		it('A20 keeps conferences without a link independent', async () => {
			const first = await startedCallId(groupId);
			const second = await startedCallId(otherGroupId);
			liveCalls.push(first, second);

			expect(first).to.not.equal(second);
		});

		it('A21 lists a conference started from a link', async () => {
			const link = await createdLink(groupId, `${run} Listed`);
			liveCalls.push(await startedCallId(groupId, link.url));

			const res = await request.get(api('video-conference.list')).set(credentials).query({ roomId: groupId }).expect(200);
			expect(res.body.data.some(({ customUrl }: { customUrl?: string }) => customUrl === link.url)).to.be.true;
		});

		it('A24 A25 lets a live conference run on through a rename and a delete', async () => {
			const link = await createdLink(groupId, `${run} Ongoing`);
			const callId = await startedCallId(groupId, link.url);
			liveCalls.push(callId);

			await renameLink(link._id, `${run} Ongoing renamed`).expect(200);
			let conference = (await info(callId).expect(200)).body;
			expect(conference).to.include({ status: VideoConferenceStatus.STARTED, title: link.title });

			await deleteLink(link._id).expect(200);
			conference = (await info(callId).expect(200)).body;
			expect(conference).to.include({ status: VideoConferenceStatus.STARTED, title: link.title });

			const res = await start({ roomId: groupId, customUrl: link.url }).expect(400);
			expect(res.body.error).to.equal('error-invalid-conference-room');
		});
	});

	describe('housekeeping', () => {
		it("A23 follows a username change on the creator's links", async () => {
			const creator = await createUser();
			const creatorCredentials = await login(creator.username, password);
			// The creator's own private group: the admin is not a member, so every room request uses the creator.
			const room = (await createRoom({ type: 'p', name: `pcl-creator-${run}`, credentials: creatorCredentials })).body.group;
			try {
				const link = (await createLink(room._id, `${run} Mine`, creatorCredentials).expect(200)).body.room;

				const username = `${creator.username}.renamed`;
				await request.post(api('users.update')).set(credentials).send({ userId: creator._id, data: { username } }).expect(200);

				const list = await listLinks(room._id, creatorCredentials).expect(200);
				expect(list.body.rooms.find(({ _id }: IVideoConferenceRoom) => _id === link._id).createdBy).to.include({ username });
			} finally {
				await request.post(api('groups.delete')).set(creatorCredentials).send({ roomId: room._id }).expect(200);
				await deleteUser(creator);
			}
		});

		it("A22 removes a deleted room's links", async () => {
			const room = (await createRoom({ type: 'p', name: `pcl-deleted-${run}` })).body.group;
			const link = await createdLink(room._id, `${run} Doomed`);

			await deleteRoom({ type: 'p', roomId: room._id });

			const stored = await withDatabase((db) => db.collection('rocketchat_video_conference_rooms').countDocuments({ rid: room._id }));
			expect(stored).to.equal(0);
			await info(link.url).expect(400);
		});
	});
});
