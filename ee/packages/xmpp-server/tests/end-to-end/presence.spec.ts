import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { polling, uniqueSuffix } from './helper/config';
import {
	connectSession,
	createLocalUser,
	findUser,
	overrideSetting,
	setStatus,
	teardown,
	waitForDirectMessageWith,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import { isPresenceFrom } from './helper/xmpp-client';
import type { Predicate, XmppUser } from './helper/xmpp-client';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

const isSubscriptionReply =
	(from: string, type: 'subscribed' | 'unsubscribed'): Predicate =>
	(stanza) =>
		isPresenceFrom(from)(stanza) && stanza.attrs.type === type;

describe('XMPP federation: presence', () => {
	let rc: RocketChat;
	let alice: XmppUser;
	let bob: XmppUser;
	let local: LocalUser;

	before(async () => {
		rc = await setupSuite();
		await overrideSetting(rc, 'XMPP_Server_Presence_Enabled', true);
		alice = await registerXmppUser(rc, 'alice');
		bob = await registerXmppUser(rc, 'bob');
		await assertFederationReachable(rc, alice);
		local = await createLocalUser(rc, 'presence');
		await connectSession(rc, local);

		// Only a DM partner may subscribe, and the XMPP server only relays presence along a subscription
		const text = `hello ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text);
		const dm = await waitForDirectMessageWith(rc, local, alice.jid);
		await waitForMessage(local, dm, text);
	});

	after(() => teardown(rc));

	it('auto-accepts a subscription request from a DM partner', async () => {
		await alice.sendPresence({ to: local.jid, type: 'subscribe' });
		await alice.waitFor(isSubscriptionReply(local.jid, 'subscribed'), 'the subscription approval');
	});

	it('refuses a subscription request from a user without a DM', async () => {
		await bob.sendPresence({ to: local.jid, type: 'subscribe' });
		await bob.waitFor(isSubscriptionReply(local.jid, 'unsubscribed'), 'the subscription refusal');
		assert.equal(bob.received(isSubscriptionReply(local.jid, 'subscribed')).length, 0);
	});

	// Known bug: ../../../../../docs/features/xmpp-server.md#rocketchat-status-changes-do-not-reach-xmpp-contacts
	it.skip('relays a Rocket.Chat status change to subscribed contacts', async () => {
		const after = alice.cursor();
		await setStatus(local, 'away');
		await alice.waitFor((stanza) => isPresenceFrom(local.jid)(stanza) && stanza.getChildText('show') === 'away', 'presence show=away', {
			after,
		});
	});

	// Known bug: ../../../../../docs/features/xmpp-server.md#presence-from-xmpp-users-is-ignored
	it.skip("applies a contact's presence to their Rocket.Chat user", async () => {
		await alice.sendPresence({ to: local.jid, show: 'dnd' });
		await retry(
			"alice's status to become busy",
			async () => {
				assert.equal((await findUser(rc, alice.jid))?.status, 'busy');
			},
			polling,
		);
	});
});
