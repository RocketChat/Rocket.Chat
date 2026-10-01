import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import type { IRoom } from '@rocket.chat/core-typings';

import { polling, uniqueSuffix } from './helper/config';
import {
	createLocalUser,
	deleteRoomOnCleanup,
	expectStoredOnce,
	findRoomByName,
	forgetRemoteUserOnCleanup,
	inviteToRoom,
	leaveRoom,
	listMemberUsernames,
	messagesWithText,
	sendMessage,
	teardown,
	updateMessage,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import { isGroupchat, isOccupantPresence, replacedId } from './helper/xmpp-client';
import type { XmppUser } from './helper/xmpp-client';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

describe('XMPP federation: rooms hosted by the XMPP server', () => {
	let rc: RocketChat;
	let alice: XmppUser;

	before(async () => {
		rc = await setupSuite();
		alice = await registerXmppUser(rc, 'alice');
		await assertFederationReachable(rc, alice);
	});

	after(() => teardown(rc));

	/** A members-only room owned by alice; Rocket.Chat mirrors it as the channel `xmpp_<localpart>`. */
	async function openRoom({ archive }: { archive: boolean }): Promise<{ roomJid: string; shadowName: string }> {
		const localpart = `xe2e-room-${uniqueSuffix()}`;
		const roomJid = await alice.createRoom(localpart, { membersOnly: true, archive });
		rc.cleanup.add(() => alice.destroyRoom(roomJid));
		// Remote occupants are materialized as `<nick>#<room JID>`
		forgetRemoteUserOnCleanup(rc, `${alice.username}#${roomJid}`);
		return { roomJid, shadowName: `xmpp_${localpart}` };
	}

	async function inviteFromXmpp(roomJid: string, user: LocalUser): Promise<void> {
		await alice.grantMembership(roomJid, user.jid);
		await alice.invite(roomJid, user.jid);
	}

	async function addFromRocketChat(roomJid: string, inviter: LocalUser, shadow: IRoom, user: LocalUser): Promise<void> {
		// A members-only room only admits listed members, whoever brought them in
		await alice.grantMembership(roomJid, user.jid);
		await inviteToRoom(inviter, shadow, user.username);
	}

	async function waitForShadowRoom(shadowName: string, roomJid: string): Promise<IRoom> {
		let shadow: IRoom | undefined;
		await retry(
			`Rocket.Chat to mirror ${roomJid}`,
			async () => {
				shadow = await findRoomByName(rc.admin, shadowName);
				assert.ok(shadow, `no shadow room for ${roomJid} yet`);
			},
			polling,
		);
		const room = shadow as IRoom;
		deleteRoomOnCleanup(rc, room._id);
		assert.equal(room.xmppFederation?.role, 'remote-muc');
		assert.equal(room.xmppFederation?.muc, roomJid);
		return room;
	}

	const waitForOccupant = (roomJid: string, user: LocalUser, after = 0) =>
		alice.waitFor(isOccupantPresence(roomJid, user.username), `${user.username} to join ${roomJid}`, { after });

	describe('membership and messages', () => {
		let a: LocalUser;
		let b: LocalUser;
		let c: LocalUser;
		let roomJid: string;
		let shadowName: string;
		let shadow: IRoom;

		before(async () => {
			[a, b, c] = [await createLocalUser(rc, 'a'), await createLocalUser(rc, 'b'), await createLocalUser(rc, 'c')];
			({ roomJid, shadowName } = await openRoom({ archive: true }));
		});

		it('mirrors the room in Rocket.Chat when a local user is invited', async () => {
			await inviteFromXmpp(roomJid, a);
			shadow = await waitForShadowRoom(shadowName, roomJid);
			assert.ok((await listMemberUsernames(a, shadow)).includes(a.username));
			await waitForOccupant(roomJid, a);
		});

		it('relays messages both ways', async () => {
			const inbound = `hello from the room ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, inbound);
			const stored = await expectStoredOnce(a, shadow, inbound);
			assert.equal(stored.u.username, `${alice.username}#${roomJid}`);

			const outbound = `hello from rocket.chat ${uniqueSuffix()}`;
			await sendMessage(a, shadow._id, outbound);
			await alice.waitFor(isGroupchat({ roomJid, nick: a.username, body: outbound }), 'the Rocket.Chat message');
		});

		// Known defect: ../../docs/specs/message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages
		it.skip('applies a correction from an occupant to the stored message', async () => {
			const id = `e2e-${uniqueSuffix()}`;
			const text = `before correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, text, { id });
			const original = await waitForMessage(a, shadow, text);

			const corrected = `after correction ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, corrected, { replaces: id });
			const stored = await expectStoredOnce(a, shadow, corrected);
			assert.equal(stored._id, original._id);
		});

		it('joins a member added in Rocket.Chat with their own session', async () => {
			await addFromRocketChat(roomJid, a, shadow, b);
			await waitForOccupant(roomJid, b);
		});

		// Known defect: ../../docs/specs/remote-muc.md#d1-a-second-invite-into-a-mirrored-room-does-not-make-the-user-a-member
		it.skip('subscribes a second local user invited from the XMPP side', async () => {
			await inviteFromXmpp(roomJid, c);
			await waitForOccupant(roomJid, c);
			await retry(
				`${c.username} to be a member of the shadow room`,
				async () => {
					assert.ok((await listMemberUsernames(a, shadow)).includes(c.username));
				},
				polling,
			);
		});

		it('leaves the room when a member leaves in Rocket.Chat', async () => {
			await leaveRoom(b, shadow);
			await alice.waitFor(isOccupantPresence(roomJid, b.username, { type: 'unavailable' }), `${b.username} to leave`);
		});
	});

	describe('with several Rocket.Chat members', () => {
		let members: LocalUser[];
		let roomJid: string;
		let shadow: IRoom;

		before(async () => {
			members = [await createLocalUser(rc, 'a'), await createLocalUser(rc, 'b'), await createLocalUser(rc, 'c')];
			const opened = await openRoom({ archive: true });
			roomJid = opened.roomJid;
			await inviteFromXmpp(roomJid, members[0]);
			shadow = await waitForShadowRoom(opened.shadowName, roomJid);
			await waitForOccupant(roomJid, members[0]);
		});

		it('does not store history again when more members join', async () => {
			const early = `before the others joined ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, early);
			await waitForMessage(members[0], shadow, early);

			// Each new session gets the room history replayed, carrying the same stanza-id
			for (const member of members.slice(1)) {
				const after = alice.cursor();
				await addFromRocketChat(roomJid, members[0], shadow, member);
				await waitForOccupant(roomJid, member, after);
			}
			await sleep(3000);
			assert.equal((await messagesWithText(members[0], shadow, early)).length, 1);
		});

		// Known defect: ../../docs/specs/message-deduplication.md#d1-concurrent-copies-of-one-message-are-all-stored
		it.skip('stores a message from the room once, whatever the number of member sessions', async () => {
			const text = `fan-out ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, text);
			await expectStoredOnce(members[0], shadow, text);
		});

		// Known defect: ../../docs/specs/message-deduplication.md#d2-a-members-own-message-comes-back-from-a-room-that-assigns-its-own-ids
		it.skip("does not store a member's own message again when the room reflects it to the other sessions", async () => {
			const text = `reflected ${uniqueSuffix()}`;
			await sendMessage(members[0], shadow._id, text);
			await alice.waitFor(isGroupchat({ roomJid, nick: members[0].username, body: text }), 'the Rocket.Chat message');

			const stored = await expectStoredOnce(members[0], shadow, text);
			assert.equal(stored.u.username, members[0].username);
		});

		it('delivers an edit as an XEP-0308 correction and does not store it again when the room reflects it', async () => {
			const original = await sendMessage(members[0], shadow._id, `before edit ${uniqueSuffix()}`);
			await alice.waitFor(isGroupchat({ roomJid, nick: members[0].username, body: original.msg }), 'the original message');

			const edited = `after edit ${uniqueSuffix()}`;
			await updateMessage(members[0], shadow._id, original._id, edited);
			const correction = await alice.expectOnce(isGroupchat({ roomJid, nick: members[0].username, body: edited }), 'the edited text');
			assert.equal(replacedId(correction), original._id);

			// The room reflects the correction to the other members' sessions, under a room-assigned id
			const stored = await expectStoredOnce(members[0], shadow, edited);
			assert.equal(stored._id, original._id);
		});
	});

	describe('with several Rocket.Chat members in a room without archive ids', () => {
		let members: LocalUser[];
		let roomJid: string;
		let shadow: IRoom;

		before(async () => {
			members = [await createLocalUser(rc, 'a'), await createLocalUser(rc, 'b')];
			const opened = await openRoom({ archive: false });
			roomJid = opened.roomJid;
			await inviteFromXmpp(roomJid, members[0]);
			shadow = await waitForShadowRoom(opened.shadowName, roomJid);
			await waitForOccupant(roomJid, members[0]);
			const after = alice.cursor();
			await addFromRocketChat(roomJid, members[0], shadow, members[1]);
			await waitForOccupant(roomJid, members[1], after);
		});

		// Known defect: ../../docs/specs/message-deduplication.md#d3-copies-without-any-id-are-never-deduplicated
		it.skip('stores a message sent without an id once', async () => {
			const text = `no id ${uniqueSuffix()}`;
			await alice.sendGroupchat(roomJid, text, { id: null });
			await expectStoredOnce(members[0], shadow, text);
		});
	});
});
