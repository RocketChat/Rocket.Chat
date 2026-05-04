import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { isSdkTransportEnabled } from '../../lib/sdk/sdkTransportEnabled';
import { userIdStore } from '../../lib/user';

/**
 * Reset Meteor.connection's revival/quiescence bookkeeping at boot.
 *
 * Meteor's bootstrap subscriptions (loginServiceConfiguration,
 * autoupdate) are opened before our overrides load. Until those are
 * "revived" against the live DDP session, `_waitingForQuiescence()`
 * returns true and `_livedata_data` buffers every incoming frame
 * instead of processing it — including the synthetic `updated` frame
 * that ddpOverREST.processResult emits to drive method invoker
 * callbacks. Wiping the revival/quiescence state lets that synthetic
 * frame reach the invoker in the same tick.
 *
 * NOTE: an earlier revision of this file also called
 * `_stream.disconnect({ _permanent: true })` to make DDPSDK the sole
 * transport. That broke `MethodInvoker.sendMessage()`'s
 * `if (this.connection._stream._connected) { _send(...) }` gate — with
 * the stream dead, sendMessage queues the invoker waiting for a
 * connection that never returns and ddpOverREST's `_send` wrapper
 * never fires for any method. Lying `_connected = true` after the
 * disconnect makes `sendMessage` proceed but causes other Meteor
 * internals to dispatch on the dead socket and crash the page. So
 * Meteor's WS now stays connected — invokers reach `_send`, which
 * ddpOverREST intercepts and routes to REST (or DDPSDK for `login`).
 */
if (isSdkTransportEnabled()) {
	const conn = Meteor.connection as unknown as {
		_subsBeingRevived: Record<string, unknown>;
		_methodsBlockingQuiescence: Record<string, unknown>;
		_messagesBufferedUntilQuiescence: unknown[];
		_outstandingMethodBlocks: unknown[];
		_methodInvokers: Record<string, unknown>;
	};

	conn._subsBeingRevived = Object.create(null);
	conn._methodsBlockingQuiescence = Object.create(null);
	conn._messagesBufferedUntilQuiescence = [];

	let saw: string | undefined = userIdStore.getState();
	userIdStore.subscribe((next) => {
		if (next === saw) return;
		saw = next;
		if (next) {
			(Accounts as unknown as { _setLoggingIn?: (v: boolean) => void })._setLoggingIn?.(false);
		}
	});

	Accounts.onLogout(() => {
		conn._outstandingMethodBlocks = [];
		conn._methodInvokers = Object.create(null);
		conn._methodsBlockingQuiescence = Object.create(null);
		conn._messagesBufferedUntilQuiescence = [];
		conn._subsBeingRevived = Object.create(null);
	});
}
