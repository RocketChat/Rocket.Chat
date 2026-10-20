import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { IRoom } from '@rocket.chat/core-typings';

import { federationPolling, uniqueSuffix, withUppercaseDomain } from './helper/config';
import { isGroupchat, isOccupantPresence, isRoomInvite, isRoomSubject, replacedId, statusCodes } from './helper/predicates';
import {
	banFromRoom,
	createHostedRoom,
	createLocalUser,
	deleteRoom,
	deleteRoomOnCleanup,
	expectStoredOnce,
	findUser,
	getSetting,
	inviteToRoom,
	kickFromRoom,
	leaveRoom,
	listMemberUsernames,
	sendMessage,
	setRoomTopic,
	setSetting,
	setRoomType,
	teardown,
	updateMessage,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat, RoomRef } from './helper/rocketchat';
import { NS } from './helper/stanza';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import { StanzaError } from './helper/xmpp-client';
import type { XmppUser } from './helper/xmpp-client';
import { createRoom } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

const mucJidOf = (room: IRoom): string => {
	assert.ok(room.xmppFederation?.role === 'host-muc', `expected a host-muc room, got ${room.xmppFederation?.role}`);
	assert.ok(room.xmppFederation.muc, 'hosted room has no MUC JID');
	return room.xmppFederation.muc;
};

const waitForMember = (owner: LocalUser, room: IRoom, username: string, present = true) =>
	retry(
		`${username} to be ${present ? '' : 'no longer '}a member of ${room._id}`,
		async () => {
			assert.equal((await listMemberUsernames(owner, room)).includes(username), present);
		},
		federationPolling,
	);

describe('XMPP federation: rooms hosted by Rocket.Chat', () => {
	let rc: RocketChat;
	let owner: LocalUser;
	let alice: XmppUser;

	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
		owner = await createLocalUser(rc, 'owner');
	});

	after(() => teardown(rc));

	describe('creation', () => {
		const conflicting = [
			['encrypted', { extraData: { xmppFederated: true, encrypted: true } }],
			['read-only', { readOnly: true, extraData: { xmppFederated: true } }],
			['broadcast', { extraData: { xmppFederated: true, broadcast: true } }],
		] as const;

		conflicting.forEach(([option, params]) => {
			it(`refuses a room that is also ${option} (R1)`, async () => {
				await assert.rejects(
					createRoom({ type: 'p', name: `xe2e-${option}-${uniqueSuffix()}`, config: owner.config, ...params }),
					/error-xmpp-room-options-not-allowed/,
				);
			});
		});

		it('takes a member JID typed with another spelling of its domain as that XMPP user (R11, addressing R4)', async () => {
			const room = await createHostedRoom(rc, owner, {
				type: 'p',
				name: `xe2e-spelling-${uniqueSuffix()}`,
				members: [withUppercaseDomain(alice.bareJid)],
			});
			const usernames = await listMemberUsernames(owner, room);
			assert.ok(usernames.includes(alice.bareJid), `expected ${alice.bareJid} among ${usernames.join(', ')}`);
			assert.ok(!usernames.includes(withUppercaseDomain(alice.bareJid)));
		});

		it('adds a JID typed with another spelling of its domain as that XMPP user (addressing R4)', async () => {
			const room = await createHostedRoom(rc, owner, { type: 'p', name: `xe2e-spelling-add-${uniqueSuffix()}` });
			await inviteToRoom(owner, room, withUppercaseDomain(alice.bareJid));
			await waitForMember(owner, room, alice.bareJid);
		});

		it('creates an unencrypted group where the workspace forces encryption on private rooms (R1)', async () => {
			const settings = ['E2E_Enable', 'E2E_Force_Encryption_For_Private_Rooms'];
			const originals = await Promise.all(settings.map((id) => getSetting(rc, id)));
			try {
				await Promise.all(settings.map((id) => setSetting(rc, id, true)));
				const room = await createHostedRoom(rc, owner, { type: 'p', name: `xe2e-forced-${uniqueSuffix()}` });
				mucJidOf(room);
				assert.ok(!room.encrypted);
			} finally {
				await Promise.all(settings.map((id, i) => setSetting(rc, id, originals[i])));
			}
		});
	});

	describe('public channel', () => {
		let room: IRoom;
		let muc: string;

		before(async () => {
			room = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-pub-${uniqueSuffix()}` });
			muc = mucJidOf(room);
		});

		it('is listed by the MUC service (R3)', async () => {
			const items = (await alice.discoItems(rc.mucDomain)).getChild('query', NS.discoItems)?.getChildren('item') ?? [];
			assert.ok(
				items.some((item) => item.attrs.jid === muc),
				`${muc} not in ${items.map((item) => item.attrs.jid).join(', ')}`,
			);
		});

		it('admits anyone, showing Rocket.Chat members as occupants (R4, R6, R7)', async () => {
			const after = alice.cursor();
			await alice.joinRoom(muc);
			assert.ok(alice.received(isOccupantPresence(muc, owner.username), after).length, 'the owner is not in the roster');
			await waitForMember(owner, room, alice.bareJid);
		});

		it('relays messages both ways (R13, R14)', async () => {
			const inbound = `hello from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			const stored = await expectStoredOnce(owner, room, inbound);
			assert.equal(stored.u.username, alice.bareJid);

			const outbound = `hello from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(owner, room._id, outbound);
			await alice.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner message');
		});

		it('applies a correction from the XMPP user to the stored message (message-corrections R4)', async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `before correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text, { id });
			const original = await waitForMessage(owner, room, text);

			const corrected = `after correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, corrected, { replaces: id });
			const stored = await expectStoredOnce(owner, room, corrected);
			assert.equal(stored._id, original._id);
		});

		it("drops the XMPP user's membership when they leave the room (R8)", async () => {
			await alice.leaveRoom(muc);
			await waitForMember(owner, room, alice.bareJid, false);
		});

		it('refuses a join from an XMPP user banned from the channel (R4)', async () => {
			await inviteToRoom(owner, room, alice.bareJid);
			await waitForMember(owner, room, alice.bareJid);
			const aliceUser = await findUser(rc, alice.bareJid);
			assert.ok(aliceUser);
			await banFromRoom(owner, room, aliceUser._id);

			await assert.rejects(alice.joinRoom(muc), (error: unknown) => error instanceof StanzaError && error.condition === 'forbidden');
		});
	});

	describe('private group', () => {
		let bob: XmppUser;
		let carol: XmppUser;
		let room: IRoom;
		let muc: string;

		before(async () => {
			bob = await registerXmppUser(rc, 'bob');
			carol = await registerXmppUser(rc, 'carol');
			room = await createHostedRoom(rc, owner, { type: 'p', name: `xe2e-priv-${uniqueSuffix()}`, members: [alice.bareJid] });
			muc = mucJidOf(room);
		});

		it('invites the XMPP members it was created with (R11)', async () => {
			await alice.waitFor(isRoomInvite(muc), 'the invitation');
		});

		it('is not listed by the MUC service (R3)', async () => {
			const items = (await alice.discoItems(rc.mucDomain)).getChild('query', NS.discoItems)?.getChildren('item') ?? [];
			assert.ok(!items.some((item) => item.attrs.jid === muc));
		});

		it('refuses a join from an XMPP user who was not invited (R4)', async () => {
			await assert.rejects(
				carol.joinRoom(muc),
				(error: unknown) => error instanceof StanzaError && error.condition === 'registration-required',
			);
		});

		it('admits the invitee (R4, R11)', async () => {
			await alice.joinRoom(muc);
		});

		it('refuses a join from an invitee banned from the group (R4)', async () => {
			await inviteToRoom(owner, room, carol.bareJid);
			await waitForMember(owner, room, carol.bareJid);
			const carolUser = await findUser(rc, carol.bareJid);
			assert.ok(carolUser);
			await banFromRoom(owner, room, carolUser._id);

			await assert.rejects(carol.joinRoom(muc), (error: unknown) => error instanceof StanzaError && error.condition === 'forbidden');
		});

		it('invites an XMPP user added after creation (R11)', async () => {
			await inviteToRoom(owner, room, bob.bareJid);
			await bob.waitFor(isRoomInvite(muc), 'the invitation');
			await bob.joinRoom(muc);
		});

		it('relays messages both ways (R13, R14)', async () => {
			const inbound = `private hello ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			await expectStoredOnce(owner, room, inbound);

			const outbound = `private reply ${uniqueSuffix()}`;
			await sendMessage(owner, room._id, outbound);
			await alice.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner reply');
			await bob.waitFor(isGroupchat({ roomJid: muc, nick: owner.username, body: outbound }), 'the owner reply');
		});

		it("does not let an XMPP user correct another occupant's message (message-corrections R7)", async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `not yours ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text, { id });
			const original = await waitForMessage(owner, room, text);

			const forged = `forged correction ${uniqueSuffix()}`;
			await bob.sendGroupchat(muc, forged, { replaces: id });
			const stored = await waitForMessage(owner, room, forged);
			assert.notEqual(stored._id, original._id);
			assert.equal((await waitForMessage(owner, room, text))._id, original._id);
		});

		// Known defect: ../../docs/specs/message-corrections.md#d2-the-room-strips-corrections-it-relays-between-xmpp-users
		it.skip("relays an XMPP user's correction to the other XMPP occupants as a correction (message-corrections D2)", async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `before correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text, { id });
			await bob.waitFor(isGroupchat({ roomJid: muc, nick: alice.username, body: text }), "alice's message");

			const corrected = `after correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, corrected, { replaces: id });
			const correction = await bob.waitFor(isGroupchat({ roomJid: muc, nick: alice.username, body: corrected }), "alice's correction");
			assert.equal(replacedId(correction), id);
		});

		it('shows Rocket.Chat members joining and leaving as occupants (R10, R16)', async () => {
			const member = await createLocalUser(rc, 'member');
			await inviteToRoom(owner, room, member.username);
			await alice.waitFor(isOccupantPresence(muc, member.username), 'the new member presence');

			await leaveRoom(member, room);
			await alice.waitFor(isOccupantPresence(muc, member.username, { type: 'unavailable' }), 'the member leaving');
		});

		it('kicks an XMPP user removed in Rocket.Chat and tells the other occupants (R9)', async () => {
			const bobUser = await findUser(rc, bob.bareJid);
			assert.ok(bobUser);
			await kickFromRoom(owner, room, bobUser._id);

			const kicked = await alice.waitFor(isOccupantPresence(muc, bob.username, { type: 'unavailable' }), "bob's removal");
			assert.ok(statusCodes(kicked).includes('307'), `expected status 307, got ${statusCodes(kicked).join(',')}`);
		});

		// Known defect: ../../docs/specs/hosted-muc.md#d1-kicked-xmpp-users-are-not-told-they-were-removed
		it.skip('tells the kicked XMPP user they were removed (D1)', async () => {
			const notice = await bob.waitFor(isOccupantPresence(muc, bob.username, { type: 'unavailable' }), 'his own removal');
			assert.ok(statusCodes(notice).includes('307'));
		});

		// Known defect: ../../docs/specs/hosted-muc.md#d6-an-xmpp-user-listed-when-a-room-is-created-joins-any-room
		it.skip('refuses JIDs listed when creating a group that is not XMPP-federated (R12, D6)', async () => {
			const attempt = createRoom({ type: 'p', name: `xe2e-plain-${uniqueSuffix()}`, members: [alice.bareJid], config: owner.config });
			// While D6 stands the group is created, and must not outlive the suite
			attempt.then(
				(res) => deleteRoomOnCleanup(rc, (res.body as { group: IRoom }).group._id),
				() => undefined,
			);
			await assert.rejects(attempt, /error-xmpp-users-in-non-xmpp-rooms/);
		});

		it('refuses JIDs in a group that is not XMPP-federated (R12)', async () => {
			const res = await createRoom({ type: 'p', name: `xe2e-plain-${uniqueSuffix()}`, config: owner.config });
			const groupId = (res.body as { group: IRoom }).group._id;
			deleteRoomOnCleanup(rc, groupId);
			await assert.rejects(inviteToRoom(owner, { _id: groupId, t: 'p' }, alice.bareJid), /error-xmpp-users-in-non-xmpp-rooms/);
		});
	});

	describe('with several Rocket.Chat members', () => {
		let members: LocalUser[];
		let room: IRoom;
		let muc: string;

		before(async () => {
			members = [await createLocalUser(rc, 'a'), await createLocalUser(rc, 'b')];
			room = await createHostedRoom(rc, owner, {
				type: 'p',
				name: `xe2e-many-${uniqueSuffix()}`,
				members: [...members.map((member) => member.username), alice.bareJid],
			});
			muc = mucJidOf(room);
			await alice.waitFor(isRoomInvite(muc), 'the invitation');
			await alice.joinRoom(muc);
		});

		it('stores a message from the XMPP user once (R15, message-deduplication R5)', async () => {
			const text = `once from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, text);
			await expectStoredOnce(owner, room, text);
		});

		it('delivers a Rocket.Chat message to the XMPP user once (R14)', async () => {
			const text = `once from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(members[0], room._id, text);
			await alice.expectOnce(isGroupchat({ roomJid: muc, nick: members[0].username, body: text }), 'the message');
		});

		it('keeps both directions single after another Rocket.Chat member joins (R14, R15, R16, message-deduplication R5)', async () => {
			const late = await createLocalUser(rc, 'late');
			await inviteToRoom(owner, room, late.username);
			await alice.waitFor(isOccupantPresence(muc, late.username), 'the late member presence');

			const inbound = `after join from xmpp ${uniqueSuffix()}`;
			await alice.sendGroupchat(muc, inbound);
			await expectStoredOnce(late, room, inbound);

			const outbound = `after join from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(late, room._id, outbound);
			await alice.expectOnce(isGroupchat({ roomJid: muc, nick: late.username, body: outbound }), 'the late member message');
		});

		it('delivers an edit as an XEP-0308 correction, not a second message (R14, message-corrections R1)', async () => {
			const original = await sendMessage(members[0], room._id, `before edit ${uniqueSuffix()}`);
			await alice.waitFor(isGroupchat({ roomJid: muc, body: original.msg }), 'the original message');

			const edited = `after edit ${uniqueSuffix()}`;
			await updateMessage(members[0], room._id, original._id, edited);
			const correction = await alice.expectOnce(isGroupchat({ roomJid: muc, body: edited }), 'the edited text');
			assert.equal(replacedId(correction), original._id);
			assert.notEqual(correction.attrs.id, original._id, 'a correction needs an id of its own');
		});

		it("keeps an edit of another member's message local (message-corrections R2)", async () => {
			const original = await sendMessage(members[0], room._id, `before moderation ${uniqueSuffix()}`);
			await alice.waitFor(isGroupchat({ roomJid: muc, body: original.msg }), 'the original message');

			const after = alice.cursor();
			const edited = `moderated ${uniqueSuffix()}`;
			await updateMessage(owner, room._id, original._id, edited);
			await waitForMessage(owner, room, edited);
			await alice.expectNone(isGroupchat({ roomJid: muc, body: edited }), "the owner's edit", { after });
		});
	});

	describe('when its type changes', () => {
		let room: RoomRef;
		let muc: string;

		const isListed = async (): Promise<boolean> => {
			const items = (await alice.discoItems(rc.mucDomain)).getChild('query', NS.discoItems)?.getChildren('item') ?? [];
			return items.some((item) => item.attrs.jid === muc);
		};

		const features = async (): Promise<string[]> =>
			((await alice.discoInfo(muc)).getChild('query', NS.discoInfo)?.getChildren('feature') ?? []).map((feature) => feature.attrs.var);

		before(async () => {
			const created = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-type-${uniqueSuffix()}` });
			muc = mucJidOf(created);
			room = created;
		});

		it('stops listing a public channel made private and describes it as members-only (R2, R3)', async () => {
			assert.ok(await isListed());
			room = await setRoomType(owner, room, 'p');
			await retry(
				`${muc} to be advertised as private`,
				async () => {
					assert.equal(await isListed(), false);
					assert.deepEqual(
						(await features()).filter((feature) => /^muc_(public|hidden|open|membersonly)$/.test(feature)),
						['muc_hidden', 'muc_membersonly'],
					);
				},
				federationPolling,
			);
		});

		it('lists it again once it is made public (R2, R3)', async () => {
			room = await setRoomType(owner, room, 'c');
			await retry(
				`${muc} to be advertised as public`,
				async () => {
					assert.equal(await isListed(), true);
					assert.ok((await features()).includes('muc_open'));
				},
				federationPolling,
			);
		});
	});

	describe('after a change made in Rocket.Chat', () => {
		// Known defect: ../../docs/specs/hosted-muc.md#d3-a-new-topic-does-not-reach-occupants-already-in-the-room
		it.skip('tells occupants already in the room about a new topic (D3)', async () => {
			const room = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-topic-${uniqueSuffix()}` });
			const muc = mucJidOf(room);
			await alice.joinRoom(muc);
			await waitForMember(owner, room, alice.bareJid);

			const topic = `topic ${uniqueSuffix()}`;
			await setRoomTopic(owner, room, topic);
			await alice.waitFor(isRoomSubject({ roomJid: muc, subject: topic }), 'the new subject');
		});

		// Known defect: ../../docs/specs/hosted-muc.md#d5-a-rocketchat-member-takes-the-nick-of-an-xmpp-occupant
		it.skip('never leaves an XMPP occupant unaware that a Rocket.Chat member took their nick (D5)', async () => {
			const member = await createLocalUser(rc, 'nick');
			const room = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-nick-${uniqueSuffix()}` });
			const muc = mucJidOf(room);
			// Refusing the nick up front settles the clash as well as telling her later does
			try {
				await alice.joinRoom(muc, member.username);
			} catch (error) {
				assert.ok(error instanceof StanzaError && error.condition === 'conflict', `unexpected join error: ${error}`);
				return;
			}
			await waitForMember(owner, room, alice.bareJid);

			const after = alice.cursor();
			await inviteToRoom(owner, room, member.username);
			const text = `after the clash ${uniqueSuffix()}`;
			await sendMessage(owner, room._id, text);
			await alice.waitFor(
				(stanza) =>
					isGroupchat({ roomJid: muc, body: text })(stanza) || isOccupantPresence(muc, member.username, { type: 'unavailable' })(stanza),
				'the next message, or word that she was removed',
				{ after },
			);
		});

		// Known defect: ../../docs/specs/hosted-muc.md#d4-a-deleted-room-keeps-running-until-the-service-restarts
		it.skip('closes the room when it is deleted in Rocket.Chat (D4)', async () => {
			const room = await createHostedRoom(rc, owner, { type: 'c', name: `xe2e-deleted-${uniqueSuffix()}` });
			const muc = mucJidOf(room);
			await alice.joinRoom(muc);
			await waitForMember(owner, room, alice.bareJid);

			await deleteRoom(rc, room);
			await retry(`${muc} to be gone`, () => assert.rejects(alice.discoInfo(muc), { condition: 'item-not-found' }), federationPolling);
		});
	});
});
