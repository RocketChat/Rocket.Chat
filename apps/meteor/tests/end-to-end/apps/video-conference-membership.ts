import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, api, credentials } from '../../data/api-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

// Installing a private/test app only actually gets *enabled* under an EE license (CE hard-caps private apps at
// zero, see `canEnableApp`), so — same as `video-conferences.ts` — this whole suite needs a real provider and
// is skipped outside EE rather than half-running against a disabled app.
(IS_EE ? describe : describe.skip)('Video Conference Membership', () => {
	before((done) => getCredentials(done));

	const roomName = `apps-e2etest-room-${Date.now()}-videoconf-membership`;
	let roomId: string;

	// A member of the conference's room, unrelated to any particular call — used to prove that plain room
	// access is one of the two ways `canAccessConference` grants access.
	let roomMember: Awaited<ReturnType<typeof createUser>>;
	let roomMemberCredentials: Awaited<ReturnType<typeof login>>;

	// Never in the room and never added to any call — the negative case for every authorization check.
	let strangerUser: Awaited<ReturnType<typeof createUser>>;
	let strangerCredentials: Awaited<ReturnType<typeof login>>;

	// Added to calls via `add-participants` — a member of the *call* who has no subscription to its room, which
	// is the whole point of the membership design under test.
	let outsideUser: Awaited<ReturnType<typeof createUser>>;
	let outsideCredentials: Awaited<ReturnType<typeof login>>;

	let outsideUser2: Awaited<ReturnType<typeof createUser>>;
	let outsideUser2Credentials: Awaited<ReturnType<typeof login>>;

	const startCall = async (targetRoomId: string, overrideCredentials = credentials) => {
		const res = await request.post(api('video-conference.start')).set(overrideCredentials).send({ roomId: targetRoomId });
		return res.body.data.callId as string;
	};

	const addParticipants = (callId: string, usernames: string[], overrideCredentials = credentials) =>
		request.post(api('video-conference.add-participants')).set(overrideCredentials).send({ callId, users: usernames });

	const getInfo = (callId: string, overrideCredentials = credentials) =>
		request.get(api('video-conference.info')).set(overrideCredentials).query({ callId });

	before(async () => {
		[roomMember, strangerUser, outsideUser, outsideUser2] = await Promise.all([
			createUser({ username: `vc-member-${Date.now()}` }),
			createUser({ username: `vc-stranger-${Date.now()}` }),
			createUser({ username: `vc-outside-${Date.now()}` }),
			createUser({ username: `vc-outside2-${Date.now()}` }),
		]);
		[roomMemberCredentials, strangerCredentials, outsideCredentials, outsideUser2Credentials] = await Promise.all([
			login(roomMember.username, password),
			login(strangerUser.username, password),
			login(outsideUser.username, password),
			login(outsideUser2.username, password),
		]);

		const res = await createRoom({
			type: 'p',
			name: roomName,
			username: undefined,
			members: [roomMember.username],
			credentials: undefined,
			extraData: undefined,
		});
		roomId = res.body.group._id;

		await cleanupApps();
		await installTestApp();
		await updateSetting('Discussion_enabled', true);
		// The 'test' provider reports `persistentChat: false` (see video-conferences.ts), so starting a call never
		// auto-creates a discussion here — `share-chat` staying a deliberate, separately-tested action.
		await updateSetting('VideoConf_Default_Provider', 'test');
	});

	after(async () => {
		await Promise.all([
			cleanupApps(),
			deleteRoom({ type: 'p', roomId }),
			deleteUser(roomMember),
			deleteUser(strangerUser),
			deleteUser(outsideUser),
			deleteUser(outsideUser2),
			updateSetting('VideoConf_Default_Provider', ''),
		]);
	});

	describe('[/video-conference.add-participants]', () => {
		let callId: string;

		before(async () => {
			callId = await startCall(roomId);
		});

		it('should register the added user as a member without granting them room access', async () => {
			await addParticipants(callId, [outsideUser.username])
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('added').that.is.an('array').that.includes(outsideUser._id);
				});

			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('users').that.is.an('array');
					const member = res.body.users.find((user: { _id: string }) => user._id === outsideUser._id);
					expect(member, 'added user should be listed in the conference members').to.exist;
					expect(member).to.have.a.property('joined').equal(false);
				});

			await request
				.get(api('groups.members'))
				.set(credentials)
				.query({ roomId })
				.expect(200)
				.expect((res: Response) => {
					const usernames = res.body.members.map((member: { username: string }) => member.username);
					expect(usernames).to.not.include(outsideUser.username);
				});
		});

		it('should fail for an unknown callId', async () => {
			await addParticipants('invalid-call-id', [outsideUser.username])
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			await request
				.post(api('video-conference.add-participants'))
				.send({ callId, users: [outsideUser.username] })
				.expect(401);
		});
	});

	describe('[Authorization by membership]', () => {
		let callId: string;

		before(async () => {
			callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username]);
		});

		it('should let a call member with no room access read the conference info', async () => {
			await getInfo(callId, outsideCredentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('_id').equal(callId);
				});
		});

		it('should let a call member with no room access join the call', async () => {
			await request
				.post(api('video-conference.join'))
				.set(outsideCredentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('url').that.is.a('string');
				});
		});

		it('should fail info for a user with neither room access nor call membership', async () => {
			await getInfo(callId, strangerCredentials)
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail join for a user with neither room access nor call membership', async () => {
			await request
				.post(api('video-conference.join'))
				.set(strangerCredentials)
				.send({ callId })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});
	});

	describe('[/video-conference.decline]', () => {
		let callId: string;

		before(async () => {
			callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username]);
		});

		it("should record the decline on the caller's own membership without ending the conference", async () => {
			await request
				.post(api('video-conference.decline'))
				.set(outsideCredentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
				});

			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					const member = res.body.users.find((user: { _id: string }) => user._id === outsideUser._id);
					expect(member, 'declining member should still be listed').to.exist;
					expect(member).to.have.a.property('declined').equal(true);

					// Declining is a personal act; the conference itself must be unaffected by it.
					expect(res.body).to.not.have.a.property('endedAt');
					expect(res.body).to.have.a.property('status').equal(1);
				});
		});

		it('should fail for an unknown callId', async () => {
			await request
				.post(api('video-conference.decline'))
				.set(credentials)
				.send({ callId: 'invalid-call-id' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			await request.post(api('video-conference.decline')).send({ callId }).expect(401);
		});
	});

	describe('[/video-conference.leave]', () => {
		let callId: string;

		before(async () => {
			// Membership added via add-participants never counts as an "active participant" (it carries
			// `joined: false`), so ending-on-empty needs real joins — both the admin and the room member join
			// the call directly, using their room access rather than being registered as members up front.
			callId = await startCall(roomId);
			await request.post(api('video-conference.join')).set(credentials).send({ callId }).expect(200);
			await request.post(api('video-conference.join')).set(roomMemberCredentials).send({ callId }).expect(200);
		});

		it('should keep the conference running while someone else is still in it', async () => {
			await request
				.post(api('video-conference.leave'))
				.set(roomMemberCredentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
				});

			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.not.have.a.property('endedAt');
					expect(res.body).to.have.a.property('status').equal(1);
				});
		});

		it('should end the conference once the last participant leaves', async () => {
			await request
				.post(api('video-conference.leave'))
				.set(credentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
				});

			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('endedAt').that.is.a('string');
					// ENDED = 3 (see VideoConferenceStatus in core-typings).
					expect(res.body).to.have.a.property('status').equal(3);
				});
		});

		it('should fail for an unknown callId', async () => {
			await request
				.post(api('video-conference.leave'))
				.set(credentials)
				.send({ callId: 'invalid-call-id' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			await request.post(api('video-conference.leave')).send({ callId }).expect(401);
		});
	});

	describe('[/video-conference.ring]', () => {
		it('should ring a member who has not joined and return an empty list once they have', async () => {
			const callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username]);

			await request
				.post(api('video-conference.ring'))
				.set(credentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('rang').that.is.an('array').that.includes(outsideUser._id);
				});

			await request.post(api('video-conference.join')).set(outsideCredentials).send({ callId }).expect(200);

			await request
				.post(api('video-conference.ring'))
				.set(credentials)
				.send({ callId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('rang').that.is.an('array').with.lengthOf(0);
				});
		});

		it('should ring only the members specified in the users array', async () => {
			const callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username, outsideUser2.username]);

			await request
				.post(api('video-conference.ring'))
				.set(credentials)
				.send({ callId, users: [outsideUser2._id] })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body.rang).to.deep.equal([outsideUser2._id]);
				});
		});

		it('should fail for an unknown callId', async () => {
			await request
				.post(api('video-conference.ring'))
				.set(credentials)
				.send({ callId: 'invalid-call-id' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			const callId = await startCall(roomId);
			await request.post(api('video-conference.ring')).send({ callId }).expect(401);
		});
	});

	describe('[/video-conference.info chatAccess]', () => {
		let callId: string;

		before(async () => {
			callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username]);
		});

		it('should surface the room the chat lives in and who cannot read it', async () => {
			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('chatAccess').that.is.an('object');
					expect(res.body.chatAccess).to.have.a.property('rid').equal(roomId);
					expect(res.body.chatAccess).to.have.a.property('name').equal(roomName);
					expect(res.body.chatAccess).to.have.a.property('type').equal('p');
					expect(res.body.chatAccess).to.have.a.property('canInvite').equal(true);
					expect(res.body.chatAccess).to.have.a.property('membersWithoutAccess').that.is.an('array').that.includes(outsideUser._id);
				});
		});
	});

	describe('[/video-conference.share-chat]', () => {
		it('mode "discussion" should move the chat and give the excluded member access to it', async () => {
			const callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser.username]);

			let discussionRid: string | undefined;

			await request
				.post(api('video-conference.share-chat'))
				.set(credentials)
				.send({ callId, mode: 'discussion' })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('rid').that.is.a('string');
					discussionRid = res.body.rid;
				});

			await getInfo(callId)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('discussionRid').equal(discussionRid);
				});

			// The point of the move: the member who couldn't read the parent room can now read the discussion.
			await request
				.get(api('subscriptions.getOne'))
				.set(outsideCredentials)
				.query({ roomId: discussionRid })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					expect(res.body).to.have.a.property('subscription').that.is.an('object');
					expect(res.body.subscription).to.have.a.property('rid').equal(discussionRid);
				});
		});

		it('mode "invite" should add the member directly to a room that can take them', async () => {
			const callId = await startCall(roomId);
			await addParticipants(callId, [outsideUser2.username]);

			await request
				.post(api('video-conference.share-chat'))
				.set(credentials)
				.send({ callId, mode: 'invite' })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
					// Inviting keeps the chat in the same room, unlike moving it to a discussion.
					expect(res.body).to.have.a.property('rid').equal(roomId);
				});

			await request
				.get(api('groups.members'))
				.set(credentials)
				.query({ roomId })
				.expect(200)
				.expect((res: Response) => {
					const usernames = res.body.members.map((member: { username: string }) => member.username);
					expect(usernames).to.include(outsideUser2.username);
				});

			// Confirms real access, not just a membership record: they can now read the room directly.
			await request
				.get(api('groups.info'))
				.set(outsideUser2Credentials)
				.query({ roomId })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(true);
				});
		});

		it('mode "invite" should be refused on a DM-based conference', async () => {
			// A DM can never take a third member (`allowMemberAction` returns false unconditionally for type
			// 'd'), so `invite` has nowhere to go — this has to be a refusal, not a silent fallback to
			// 'discussion', or the caller would give away the DM's history without asking for that.
			const dmPeer = await createUser({ username: `vc-dmpeer-${Date.now()}` });
			const dmRes = await createRoom({
				type: 'd',
				name: undefined,
				username: dmPeer.username,
				members: undefined,
				credentials: undefined,
				extraData: undefined,
			});
			const dmRoomId = dmRes.body.room._id;

			try {
				const callId = await startCall(dmRoomId);
				await addParticipants(callId, [outsideUser.username]);

				await request
					.post(api('video-conference.share-chat'))
					.set(credentials)
					.send({ callId, mode: 'invite' })
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('error-not-allowed');
					});
			} finally {
				await Promise.all([deleteRoom({ type: 'd', roomId: dmRoomId }), deleteUser(dmPeer)]);
			}
		});

		it('should fail for an unknown callId', async () => {
			await request
				.post(api('video-conference.share-chat'))
				.set(credentials)
				.send({ callId: 'invalid-call-id', mode: 'invite' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			await request.post(api('video-conference.share-chat')).send({ callId: 'invalid-call-id', mode: 'invite' }).expect(401);
		});
	});

	describe('[/video-conference.info validation]', () => {
		it('should fail for an unknown callId', async () => {
			await getInfo('invalid-call-id')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});

		it('should fail when unauthenticated', async () => {
			await request.get(api('video-conference.info')).query({ callId: 'invalid-call-id' }).expect(401);
		});
	});

	describe('[/video-conference.join validation]', () => {
		it('should fail for an unknown callId', async () => {
			await request
				.post(api('video-conference.join'))
				.set(credentials)
				.send({ callId: 'invalid-call-id' })
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
				});
		});
	});
});
