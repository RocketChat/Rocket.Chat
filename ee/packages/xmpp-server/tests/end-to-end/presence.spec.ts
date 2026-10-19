import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

import { federationPolling, uniqueSuffix } from './helper/config';
import { isPresenceFrom } from './helper/predicates';
import type { Predicate } from './helper/predicates';
import {
	connectSession,
	createLocalUser,
	findUser,
	overrideSetting,
	setSetting,
	setStatus,
	teardown,
	waitForDirectMessageWith,
	waitForMessage,
} from './helper/rocketchat';
import type { LocalUser, RocketChat } from './helper/rocketchat';
import { assertFederationReachable, registerXmppUser, setupSuite } from './helper/suite';
import type { XmppUser } from './helper/xmpp-client';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';

const SETTING_PROPAGATION_MS = 2000;
const DELIVERY_WINDOW_MS = 4000;

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
		const dm = await waitForDirectMessageWith(rc, local, alice.bareJid);
		await waitForMessage(local, dm, text);
	});

	after(() => teardown(rc));

	it('auto-accepts a subscription request from a DM partner (R3)', async () => {
		await alice.sendPresence({ to: local.jid, type: 'subscribe' });
		await alice.waitFor(isSubscriptionReply(local.jid, 'subscribed'), 'the subscription approval');
	});

	it('refuses a subscription request from a user without a DM (R3)', async () => {
		await bob.sendPresence({ to: local.jid, type: 'subscribe' });
		await bob.waitFor(isSubscriptionReply(local.jid, 'unsubscribed'), 'the subscription refusal');
		assert.equal(bob.received(isSubscriptionReply(local.jid, 'subscribed')).length, 0);
	});

	it('answers no subscription request while presence is off (R5)', async () => {
		try {
			await setSetting(rc, 'XMPP_Server_Presence_Enabled', false);
			await sleep(SETTING_PROPAGATION_MS);

			const after = alice.cursor();
			await alice.sendPresence({ to: local.jid, type: 'subscribe' });
			await sleep(DELIVERY_WINDOW_MS);
			const answers = alice.received(
				(stanza) => isPresenceFrom(local.jid)(stanza) && ['subscribed', 'subscribe', 'unsubscribed'].includes(stanza.attrs.type),
				after,
			);
			assert.equal(answers.length, 0);
		} finally {
			await setSetting(rc, 'XMPP_Server_Presence_Enabled', true);
			await sleep(SETTING_PROPAGATION_MS);
		}
	});

	// Known defect: ../../docs/specs/presence.md#d2-rocketchat-status-changes-do-not-reach-xmpp-contacts
	it.skip('relays a Rocket.Chat status change to subscribed contacts (D2)', async () => {
		const after = alice.cursor();
		await setStatus(local, 'away');
		await alice.waitFor((stanza) => isPresenceFrom(local.jid)(stanza) && stanza.getChildText('show') === 'away', 'presence show=away', {
			after,
		});
	});

	it("applies a contact's presence to their Rocket.Chat user (R2)", async () => {
		await alice.sendPresence({ to: local.jid, show: 'dnd' });
		await retry(
			"alice's status to become busy",
			async () => {
				assert.equal((await findUser(rc, alice.bareJid))?.status, 'busy');
			},
			federationPolling,
		);
	});

	it("keeps a contact's presence when they send a message (R2)", async () => {
		const text = `still busy ${uniqueSuffix()}`;
		await alice.sendChat(local.jid, text);
		const dm = await waitForDirectMessageWith(rc, local, alice.bareJid);
		await waitForMessage(local, dm, text);
		assert.equal((await findUser(rc, alice.bareJid))?.status, 'busy');
	});
});
