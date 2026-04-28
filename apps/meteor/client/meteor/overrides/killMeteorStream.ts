import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

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

/**
 * Force-clear Accounts._loggingIn once a uid lands in userIdStore.
 *
 * Meteor's loggedInAndDataReadyCallback flips _loggingIn back to false
 * from inside a Tracker.autorun that awaits Meteor.userAsync(). Our
 * findOneAsync await boundary breaks Tracker dep propagation, and the
 * same autorun is where Accounts.onLogin would normally fire — so
 * neither hook fires when synchronizeUserData later writes the user
 * into the store, and the UI stays on "Connecting..." with
 * Meteor.loggingIn() pinned to true.
 *
 * userIdStore is updated by the userAndUsers Tracker.autorun the moment
 * Accounts.connection.userId() flips, which happens inside
 * makeClientLoggedIn before the broken autorun is even installed. So
 * subscribing here gives a reliable "login completed" signal — just
 * skip the synchronous boot snapshot and react only to subsequent
 * transitions.
 */
let saw: string | undefined = userIdStore.getState();
userIdStore.subscribe((next) => {
	if (next === saw) return;
	saw = next;
	if (next) {
		(Accounts as unknown as { _setLoggingIn?: (v: boolean) => void })._setLoggingIn?.(false);
	}
});

/**
 * Drain Meteor's outstanding-method queue on logout.
 *
 * Accounts.logout's `applyAsync` resolves immediately via Meteor's
 * fire-and-forget client path (the actual server response is awaited
 * only by the MethodInvoker callback). Inside that resolved `.then`,
 * makeClientLoggedOut clears userId, which fires our userIdStore
 * subscriber to teardown DDPSDK. By the time the server's logout result
 * frame would arrive, the DDPSDK socket is already closed — so the
 * logout MethodInvoker stays in `_outstandingMethodBlocks` with
 * `sentMessage=true` forever.
 *
 * The next `_addOutstandingMethod` call (e.g. token-resume right after
 * logout) checks `_outstandingMethodBlocks.length === 1` to decide
 * whether to send immediately. With the orphaned logout block ahead of
 * it, the new method is silently queued and never sent. Visible
 * failure: re-login after logout never produces a login `_send` and the
 * UI hangs on PageLoading.
 *
 * Drain inside Accounts.onLogout because it fires synchronously from
 * makeClientLoggedOut *before* setUserId(null) and before any
 * subsequent applyAsync can enqueue. Doing the same drain on the
 * userIdStore transition would race the test's `_pollStoredLoginToken`
 * call, which can enqueue the new login between makeClientLoggedOut and
 * Tracker's deferred autorun re-run — we'd then wipe the new login
 * along with the dead logout.
 */
Accounts.onLogout(() => {
	conn._outstandingMethodBlocks = [];
	conn._methodInvokers = Object.create(null);
	// Also wipe _methodsBlockingQuiescence: the logout method's wait-flag
	// is still here because its server response never landed (DDPSDK was
	// torn down by makeClientLoggedOut). With it left in place,
	// _waitingForQuiescence() stays true and _livedata_data buffers every
	// subsequent frame — including the synthetic `updated` we inject via
	// processResult to trigger dataVisible on the next method invoker. The
	// invoker would then sit with _methodResult set, _dataVisible false,
	// and the login callback never fires.
	conn._methodsBlockingQuiescence = Object.create(null);
	conn._messagesBufferedUntilQuiescence = [];
	conn._subsBeingRevived = Object.create(null);
});
