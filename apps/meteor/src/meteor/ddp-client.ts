import { Hook } from './callback-hook.ts';
import { DDPCommon } from './ddp-common.ts';
import { DiffSequence } from './diff-sequence.ts';
import { EJSON, type EJSONable } from './ejson.ts';
import { IdMap } from './id-map.ts';
import { Meteor } from './meteor.ts';
import { MongoID } from './mongo-id.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { Retry } from './retry.ts';
import { ClientStream } from './socket-stream-client.ts';
import { Tracker } from './tracker.ts';
import { hasOwn } from './utils/hasOwn.ts';
import { isEmpty } from './utils/isEmpty.ts';
import type { UnknownFunction } from './utils/isFunction.ts';
import { last } from './utils/last.ts';
import { slice } from './utils/slice.ts';

const { keys } = Object;

class MongoIDMap extends IdMap {
	constructor() {
		super(MongoID.idStringify, MongoID.idParse);
	}
}

export class ConnectionStreamHandlers {
	_connection: any;

	constructor(connection: any) {
		this._connection = connection;
	}

	/**
	 * Handles incoming raw messages from the DDP stream
	 * @param {String} raw_msg The raw message received from the stream
	 */
	async onMessage(raw_msg: string) {
		let msg;
		try {
			msg = DDPCommon.parseDDP(raw_msg);
		} catch (e) {
			Meteor._debug('Exception while parsing DDP', e);
			return;
		}

		// Any message counts as receiving a pong, as it demonstrates that
		// the server is still alive.
		if (this._connection._heartbeat) {
			this._connection._heartbeat.messageReceived();
		}

		if (msg === null || !msg.msg) {
			if (!msg || !msg.testMessageOnConnect) {
				if (keys(msg).length === 1 && msg.server_id) return;
				Meteor._debug('discarding invalid livedata message', msg);
			}
			return;
		}

		// Important: This was missing from previous version
		// We need to set the current version before routing the message
		if (msg.msg === 'connected') {
			this._connection._version = this._connection._versionSuggestion;
		}

		await this._routeMessage(msg);
	}

	/**
	 * Routes messages to their appropriate handlers based on message type
	 * @private
	 * @param {Object} msg The parsed DDP message
	 */
	async _routeMessage(msg: any) {
		switch (msg.msg) {
			case 'connected':
				await this._connection._livedata_connected(msg);
				this._connection.options.onConnected();
				break;

			case 'failed':
				await this._handleFailedMessage(msg);
				break;

			case 'ping':
				if (this._connection.options.respondToPings) {
					this._connection._send({ msg: 'pong', id: msg.id });
				}
				break;

			case 'pong':
				// noop, as we assume everything's a pong
				break;

			case 'added':
			case 'changed':
			case 'removed':
			case 'ready':
			case 'updated':
				await this._connection._livedata_data(msg);
				break;

			case 'nosub':
				await this._connection._livedata_nosub(msg);
				break;

			case 'result':
				await this._connection._livedata_result(msg);
				break;

			case 'error':
				this._connection._livedata_error(msg);
				break;

			default:
				Meteor._debug('discarding unknown livedata message type', msg);
		}
	}

	/**
	 * Handles failed connection messages
	 * @private
	 * @param {Object} msg The failed message object
	 */
	_handleFailedMessage(msg: any) {
		if (this._connection._supportedDDPVersions.indexOf(msg.version) >= 0) {
			this._connection._versionSuggestion = msg.version;
			this._connection._stream.reconnect({ _force: true });
		} else {
			const description = `DDP version negotiation failed; server requested version ${msg.version}`;
			this._connection._stream.disconnect({ _permanent: true, _error: description });
			this._connection.options.onDDPVersionNegotiationFailure(description);
		}
	}

	/**
	 * Handles connection reset events
	 */
	onReset() {
		// Reset is called even on the first connection, so this is
		// the only place we send this message.
		const msg = this._buildConnectMessage();
		this._connection._send(msg);

		// Mark non-retry calls as failed and handle outstanding methods
		this._handleOutstandingMethodsOnReset();

		// Now, to minimize setup latency, go ahead and blast out all of
		// our pending methods ands subscriptions before we've even taken
		// the necessary RTT to know if we successfully reconnected.
		this._connection._callOnReconnectAndSendAppropriateOutstandingMethods();
		this._resendSubscriptions();
	}

	/**
	 * Builds the initial connect message
	 * @private
	 * @returns {Object} The connect message object
	 */
	_buildConnectMessage() {
		const msg: any = { msg: 'connect' };
		if (this._connection._lastSessionId) {
			msg.session = this._connection._lastSessionId;
		}
		msg.version = this._connection._versionSuggestion || this._connection._supportedDDPVersions[0];
		this._connection._versionSuggestion = msg.version;
		msg.support = this._connection._supportedDDPVersions;
		return msg;
	}

	/**
	 * Handles outstanding methods during a reset
	 * @private
	 */
	_handleOutstandingMethodsOnReset() {
		const blocks = this._connection._outstandingMethodBlocks;
		if (blocks.length === 0) return;

		const currentMethodBlock = blocks[0].methods;
		blocks[0].methods = currentMethodBlock.filter((methodInvoker: any) => {
			// Methods with 'noRetry' option set are not allowed to re-send after
			// recovering dropped connection.
			if (methodInvoker.sentMessage && methodInvoker.noRetry) {
				methodInvoker.receiveResult(
					new Meteor.Error(
						'invocation-failed',
						'Method invocation might have failed due to dropped connection. ' +
							'Failing because `noRetry` option was passed to Meteor.apply.',
					),
				);
			}

			// Only keep a method if it wasn't sent or it's allowed to retry.
			return !(methodInvoker.sentMessage && methodInvoker.noRetry);
		});

		// Clear empty blocks
		if (blocks.length > 0 && blocks[0].methods.length === 0) {
			blocks.shift();
		}

		// Reset all method invokers as unsent
		Object.values(this._connection._methodInvokers).forEach((invoker: any) => {
			invoker.sentMessage = false;
		});
	}

	/**
	 * Resends all active subscriptions
	 * @private
	 */
	_resendSubscriptions() {
		Object.entries(this._connection._subscriptions).forEach(([id, sub]: [string, any]) => {
			this._connection._sendQueued({
				msg: 'sub',
				id,
				name: sub.name,
				params: sub.params,
			});
		});
	}
}

export class MessageProcessors {
	_connection: any;

	constructor(connection: any) {
		this._connection = connection;
	}

	/**
	 * @summary Process the connection message and set up the session
	 * @param {Object} msg The connection message
	 */
	async _livedata_connected(msg: any) {
		const self = this._connection;

		if (self._version !== 'pre1' && self._heartbeatInterval !== 0) {
			self._heartbeat = new DDPCommon.Heartbeat({
				heartbeatInterval: self._heartbeatInterval,
				heartbeatTimeout: self._heartbeatTimeout,
				onTimeout() {
					self._lostConnection(new DDP.ConnectionError('DDP heartbeat timed out'));
				},
				sendPing() {
					self._send({ msg: 'ping' });
				},
			});
			self._heartbeat.start();
		}

		// If this is a reconnect, we'll have to reset all stores.
		if (self._lastSessionId) self._resetStores = true;

		let reconnectedToPreviousSession;
		if (typeof msg.session === 'string') {
			reconnectedToPreviousSession = self._lastSessionId === msg.session;
			self._lastSessionId = msg.session;
		}

		if (reconnectedToPreviousSession) {
			// Successful reconnection -- pick up where we left off.
			return;
		}

		// Server doesn't have our data anymore. Re-sync a new session.

		// Forget about messages we were buffering for unknown collections. They'll
		// be resent if still relevant.
		self._updatesForUnknownStores = Object.create(null);

		if (self._resetStores) {
			// Forget about the effects of stubs. We'll be resetting all collections
			// anyway.
			self._documentsWrittenByStub = Object.create(null);
			self._serverDocuments = Object.create(null);
		}

		// Clear _afterUpdateCallbacks.
		self._afterUpdateCallbacks = [];

		// Mark all named subscriptions which are ready as needing to be revived.
		self._subsBeingRevived = Object.create(null);
		Object.entries(self._subscriptions).forEach(([id, sub]: [string, any]) => {
			if (sub.ready) {
				self._subsBeingRevived[id] = true;
			}
		});

		// Arrange for "half-finished" methods to have their callbacks run, and
		// track methods that were sent on this connection so that we don't
		// quiesce until they are all done.
		//
		// Start by clearing _methodsBlockingQuiescence: methods sent before
		// reconnect don't matter, and any "wait" methods sent on the new connection
		// that we drop here will be restored by the loop below.
		self._methodsBlockingQuiescence = Object.create(null);
		if (self._resetStores) {
			const invokers = self._methodInvokers;
			keys(invokers).forEach((id: string) => {
				const invoker = invokers[id];
				if (invoker.gotResult()) {
					// This method already got its result, but it didn't call its callback
					// because its data didn't become visible. We did not resend the
					// method RPC. We'll call its callback when we get a full quiesce,
					// since that's as close as we'll get to "data must be visible".
					self._afterUpdateCallbacks.push((...args: any[]) => invoker.dataVisible(...args));
				} else if (invoker.sentMessage) {
					// This method has been sent on this connection (maybe as a resend
					// from the last connection, maybe from onReconnect, maybe just very
					// quickly before processing the connected message).
					//
					// We don't need to do anything special to ensure its callbacks get
					// called, but we'll count it as a method which is preventing
					// reconnect quiescence. (eg, it might be a login method that was run
					// from onReconnect, and we don't want to see flicker by seeing a
					// logged-out state.)
					self._methodsBlockingQuiescence[invoker.methodId] = true;
				}
			});
		}

		self._messagesBufferedUntilQuiescence = [];

		// If we're not waiting on any methods or subs, we can reset the stores and
		// call the callbacks immediately.
		if (!self._waitingForQuiescence()) {
			if (self._resetStores) {
				for (const store of Object.values(self._stores) as any[]) {
					await store.beginUpdate(0, true);
					await store.endUpdate();
				}
				self._resetStores = false;
			}
			self._runAfterUpdateCallbacks();
		}
	}

	/**
	 * @summary Process various data messages from the server
	 * @param {Object} msg The data message
	 */
	async _livedata_data(msg: any) {
		const self = this._connection;

		if (self._waitingForQuiescence()) {
			self._messagesBufferedUntilQuiescence.push(msg);

			if (msg.msg === 'nosub') {
				delete self._subsBeingRevived[msg.id];
			}

			if (msg.subs) {
				msg.subs.forEach((subId: string) => {
					delete self._subsBeingRevived[subId];
				});
			}

			if (msg.methods) {
				msg.methods.forEach((methodId: string) => {
					delete self._methodsBlockingQuiescence[methodId];
				});
			}

			if (self._waitingForQuiescence()) {
				return;
			}

			// No methods or subs are blocking quiescence!
			// We'll now process and all of our buffered messages, reset all stores,
			// and apply them all at once.
			const bufferedMessages = self._messagesBufferedUntilQuiescence;
			for (const bufferedMessage of Object.values(bufferedMessages)) {
				await this._processOneDataMessage(bufferedMessage, self._bufferedWrites);
			}
			self._messagesBufferedUntilQuiescence = [];
		} else {
			await this._processOneDataMessage(msg, self._bufferedWrites);
		}

		// Immediately flush writes when:
		//  1. Buffering is disabled. Or;
		//  2. any non-(added/changed/removed) message arrives.
		const standardWrite = msg.msg === 'added' || msg.msg === 'changed' || msg.msg === 'removed';

		if (self._bufferedWritesInterval === 0 || !standardWrite) {
			await self._flushBufferedWrites();
			return;
		}

		if (self._bufferedWritesFlushAt === null) {
			self._bufferedWritesFlushAt = new Date().valueOf() + self._bufferedWritesMaxAge;
		} else if (self._bufferedWritesFlushAt < new Date().valueOf()) {
			await self._flushBufferedWrites();
			return;
		}

		if (self._bufferedWritesFlushHandle) {
			clearTimeout(self._bufferedWritesFlushHandle);
		}
		self._bufferedWritesFlushHandle = setTimeout(() => {
			self._liveDataWritesPromise = self._flushBufferedWrites();
			if (Meteor._isPromise(self._liveDataWritesPromise)) {
				self._liveDataWritesPromise.finally(() => (self._liveDataWritesPromise = undefined));
			}
		}, self._bufferedWritesInterval);
	}

	/**
	 * @summary Process individual data messages by type
	 * @private
	 */
	async _processOneDataMessage(msg: any, updates: any) {
		const messageType = msg.msg;

		switch (messageType) {
			case 'added':
				await this._connection._process_added(msg, updates);
				break;
			case 'changed':
				this._connection._process_changed(msg, updates);
				break;
			case 'removed':
				this._connection._process_removed(msg, updates);
				break;
			case 'ready':
				this._connection._process_ready(msg, updates);
				break;
			case 'updated':
				this._connection._process_updated(msg, updates);
				break;
			case 'nosub':
				// ignore this
				break;
			default:
				Meteor._debug('discarding unknown livedata data message type', msg);
		}
	}

	/**
	 * @summary Handle method results arriving from the server
	 * @param {Object} msg The method result message
	 */
	async _livedata_result(msg: any) {
		const self = this._connection;

		// Lets make sure there are no buffered writes before returning result.
		if (!isEmpty(self._bufferedWrites)) {
			await self._flushBufferedWrites();
		}

		// find the outstanding request
		// should be O(1) in nearly all realistic use cases
		if (isEmpty(self._outstandingMethodBlocks)) {
			Meteor._debug('Received method result but no methods outstanding');
			return;
		}
		const currentMethodBlock = self._outstandingMethodBlocks[0].methods;
		let i = -1;
		const m = currentMethodBlock.find((method: any, idx: number) => {
			const found = method.methodId === msg.id;
			if (found) i = idx;
			return found;
		});
		if (!m) {
			Meteor._debug("Can't match method response to original method call", msg);
			return;
		}

		// Remove from current method block. This may leave the block empty, but we
		// don't move on to the next block until the callback has been delivered, in
		// _outstandingMethodFinished.
		if (i !== -1) {
			currentMethodBlock.splice(i, 1);
		}

		if (hasOwn(msg, 'error')) {
			m.receiveResult(new Meteor.Error(msg.error.error, msg.error.reason, msg.error.details));
		} else {
			// msg.result may be undefined if the method didn't return a value
			m.receiveResult(undefined, msg.result);
		}
	}

	/**
	 * @summary Handle "nosub" messages arriving from the server
	 * @param {Object} msg The nosub message
	 */
	async _livedata_nosub(msg: any) {
		const self = this._connection;

		// First pass it through _livedata_data, which only uses it to help get
		// towards quiescence.
		await this._livedata_data(msg);

		// Do the rest of our processing immediately, with no
		// buffering-until-quiescence.

		// we weren't subbed anyway, or we initiated the unsub.
		if (!hasOwn(self._subscriptions, msg.id)) {
			return;
		}

		// XXX COMPAT WITH 1.0.3.1 #errorCallback
		const { errorCallback } = self._subscriptions[msg.id];
		const { stopCallback } = self._subscriptions[msg.id];

		self._subscriptions[msg.id].remove();

		const meteorErrorFromMsg = (msgArg: any) => {
			return msgArg && msgArg.error && new Meteor.Error(msgArg.error.error, msgArg.error.reason, msgArg.error.details);
		};

		// XXX COMPAT WITH 1.0.3.1 #errorCallback
		if (errorCallback && msg.error) {
			errorCallback(meteorErrorFromMsg(msg));
		}

		if (stopCallback) {
			stopCallback(meteorErrorFromMsg(msg));
		}
	}

	/**
	 * @summary Handle errors from the server
	 * @param {Object} msg The error message
	 */
	_livedata_error(msg: any) {
		Meteor._debug('Received error from server: ', msg.reason);
		if (msg.offendingMessage) Meteor._debug('For: ', msg.offendingMessage);
	}

	// Document change message processors will be defined in a separate class
}

export class DocumentProcessors {
	_connection: any;

	constructor(connection: any) {
		this._connection = connection;
	}

	/**
	 * @summary Process an 'added' message from the server
	 * @param {Object} msg The added message
	 * @param {Object} updates The updates accumulator
	 */
	async _process_added(msg: any, updates: any) {
		const self = this._connection;
		const id = MongoID.idParse(msg.id);
		const serverDoc = self._getServerDoc(msg.collection, id);

		if (serverDoc) {
			// Some outstanding stub wrote here.
			const isExisting = serverDoc.document !== undefined;

			serverDoc.document = msg.fields || Object.create(null);
			serverDoc.document._id = id;

			if (self._resetStores) {
				// During reconnect the server is sending adds for existing ids.
				// Always push an update so that document stays in the store after
				// reset. Use current version of the document for this update, so
				// that stub-written values are preserved.
				const currentDoc = await self._stores[msg.collection].getDoc(msg.id);
				if (currentDoc !== undefined) msg.fields = currentDoc;

				self._pushUpdate(updates, msg.collection, msg);
			} else if (isExisting) {
				throw new Error(`Server sent add for existing id: ${msg.id}`);
			}
		} else {
			self._pushUpdate(updates, msg.collection, msg);
		}
	}

	/**
	 * @summary Process a 'changed' message from the server
	 * @param {Object} msg The changed message
	 * @param {Object} updates The updates accumulator
	 */
	_process_changed(msg: any, updates: any) {
		const self = this._connection;
		const serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));

		if (serverDoc) {
			if (serverDoc.document === undefined) {
				throw new Error(`Server sent changed for nonexisting id: ${msg.id}`);
			}
			DiffSequence.applyChanges(serverDoc.document, msg.fields);
		} else {
			self._pushUpdate(updates, msg.collection, msg);
		}
	}

	/**
	 * @summary Process a 'removed' message from the server
	 * @param {Object} msg The removed message
	 * @param {Object} updates The updates accumulator
	 */
	_process_removed(msg: any, updates: any) {
		const self = this._connection;
		const serverDoc = self._getServerDoc(msg.collection, MongoID.idParse(msg.id));

		if (serverDoc) {
			// Some outstanding stub wrote here.
			if (serverDoc.document === undefined) {
				throw new Error(`Server sent removed for nonexisting id:${msg.id}`);
			}
			serverDoc.document = undefined;
		} else {
			self._pushUpdate(updates, msg.collection, {
				msg: 'removed',
				collection: msg.collection,
				id: msg.id,
			});
		}
	}

	/**
	 * @summary Process a 'ready' message from the server
	 * @param {Object} msg The ready message
	 * @param {Object} updates The updates accumulator
	 */
	_process_ready(msg: any, updates: any) {
		const self = this._connection;

		// Process "sub ready" messages. "sub ready" messages don't take effect
		// until all current server documents have been flushed to the local
		// database. We can use a write fence to implement this.
		msg.subs.forEach((subId: string) => {
			self._runWhenAllServerDocsAreFlushed(() => {
				const subRecord = self._subscriptions[subId];
				// Did we already unsubscribe?
				if (!subRecord) return;
				// Did we already receive a ready message? (Oops!)
				if (subRecord.ready) return;
				subRecord.ready = true;
				subRecord.readyCallback && subRecord.readyCallback();
				subRecord.readyDeps.changed();
			});
		});
	}

	/**
	 * @summary Process an 'updated' message from the server
	 * @param {Object} msg The updated message
	 * @param {Object} updates The updates accumulator
	 */
	_process_updated(msg: any, updates: any) {
		const self = this._connection;
		// Process "method done" messages.
		msg.methods.forEach((methodId: string) => {
			const docs = self._documentsWrittenByStub[methodId] || {};
			Object.values(docs).forEach((written: any) => {
				const serverDoc = self._getServerDoc(written.collection, written.id);
				if (!serverDoc) {
					throw new Error(`Lost serverDoc for ${JSON.stringify(written)}`);
				}
				if (!serverDoc.writtenByStubs[methodId]) {
					throw new Error(`Doc ${JSON.stringify(written)} not written by method ${methodId}`);
				}
				delete serverDoc.writtenByStubs[methodId];
				if (isEmpty(serverDoc.writtenByStubs)) {
					// All methods whose stubs wrote this method have completed! We can
					// now copy the saved document to the database (reverting the stub's
					// change if the server did not write to this object, or applying the
					// server's writes if it did).

					// This is a fake ddp 'replace' message.  It's just for talking
					// between livedata connections and minimongo.  (We have to stringify
					// the ID because it's supposed to look like a wire message.)
					self._pushUpdate(updates, written.collection, {
						msg: 'replace',
						id: MongoID.idStringify(written.id),
						replace: serverDoc.document,
					});
					// Call all flush callbacks.
					serverDoc.flushCallbacks.forEach((c: any) => {
						c();
					});

					// Delete this completed serverDocument. Don't bother to GC empty
					// IdMaps inside self._serverDocuments, since there probably aren't
					// many collections and they'll be written repeatedly.
					self._serverDocuments[written.collection].remove(written.id);
				}
			});
			delete self._documentsWrittenByStub[methodId];

			// We want to call the data-written callback, but we can't do so until all
			// currently buffered messages are flushed.
			const callbackInvoker = self._methodInvokers[methodId];
			if (!callbackInvoker) {
				throw new Error(`No callback invoker for method ${methodId}`);
			}

			self._runWhenAllServerDocsAreFlushed((...args: any[]) => callbackInvoker.dataVisible(...args));
		});
	}

	/**
	 * @summary Push an update to the buffer
	 * @private
	 * @param {Object} updates The updates accumulator
	 * @param {String} collection The collection name
	 * @param {Object} msg The update message
	 */
	_pushUpdate(updates: any, collection: string, msg: any) {
		if (!hasOwn(updates, collection)) {
			updates[collection] = [];
		}
		updates[collection].push(msg);
	}

	/**
	 * @summary Get a server document by collection and id
	 * @private
	 * @param {String} collection The collection name
	 * @param {String} id The document id
	 * @returns {Object|null} The server document or null
	 */
	_getServerDoc(collection: string, id: string) {
		const self = this._connection;
		if (!hasOwn(self._serverDocuments, collection)) {
			return null;
		}
		const serverDocsForCollection = self._serverDocuments[collection];
		return serverDocsForCollection.get(id) || null;
	}
}

// A MethodInvoker manages sending a method to the server and calling the user's
// callbacks. On construction, it registers itself in the connection's
// _methodInvokers map; it removes itself once the method is fully finished and
// the callback is invoked. This occurs when it has both received a result,
// and the data written by it is fully visible.
export class MethodInvoker {
	methodId: string;

	sentMessage: boolean;

	_callback: Function | undefined;

	_connection: any;

	_message: any;

	_onResultReceived: Function;

	_wait: boolean;

	noRetry: boolean;

	_methodResult: any;

	_dataVisible: boolean;

	constructor(options: any) {
		// Public (within this file) fields.
		this.methodId = options.methodId;
		this.sentMessage = false;

		this._callback = options.callback;
		this._connection = options.connection;
		this._message = options.message;
		this._onResultReceived = options.onResultReceived || (() => {});
		this._wait = options.wait;
		this.noRetry = options.noRetry;
		this._methodResult = null;
		this._dataVisible = false;

		// Register with the connection.
		this._connection._methodInvokers[this.methodId] = this;
	}

	// Sends the method message to the server. May be called additional times if
	// we lose the connection and reconnect before receiving a result.
	sendMessage() {
		// This function is called before sending a method (including resending on
		// reconnect). We should only (re)send methods where we don't already have a
		// result!
		if (this.gotResult()) throw new Error('sendingMethod is called on method with result');

		// If we're re-sending it, it doesn't matter if data was written the first
		// time.
		this._dataVisible = false;
		this.sentMessage = true;

		// If this is a wait method, make all data messages be buffered until it is
		// done.
		if (this._wait) this._connection._methodsBlockingQuiescence[this.methodId] = true;

		// Actually send the message.
		this._connection._send(this._message);
	}

	// Invoke the callback, if we have both a result and know that all data has
	// been written to the local cache.
	_maybeInvokeCallback() {
		if (this._methodResult && this._dataVisible) {
			// Call the callback. (This won't throw: the callback was wrapped with
			// bindEnvironment.)
			this._callback?.(this._methodResult[0], this._methodResult[1]);

			// Forget about this method.
			delete this._connection._methodInvokers[this.methodId];

			// Let the connection know that this method is finished, so it can try to
			// move on to the next block of methods.
			this._connection._outstandingMethodFinished();
		}
	}

	// Call with the result of the method from the server. Only may be called
	// once; once it is called, you should not call sendMessage again.
	// If the user provided an onResultReceived callback, call it immediately.
	// Then invoke the main callback if data is also visible.
	receiveResult(err: any, result: any) {
		if (this.gotResult()) throw new Error('Methods should only receive results once');
		this._methodResult = [err, result];
		this._onResultReceived(err, result);
		this._maybeInvokeCallback();
	}

	// Call this when all data written by the method is visible. This means that
	// the method has returns its "data is done" message *AND* all server
	// documents that are buffered at that time have been written to the local
	// cache. Invokes the main callback if the result has been received.
	dataVisible() {
		this._dataVisible = true;
		this._maybeInvokeCallback();
	}

	// True if receiveResult has been called.
	gotResult() {
		return !!this._methodResult;
	}
}

// @param url {String|Object} URL to Meteor app,
//   or an object as a test hook (see code)
// Options:
//   reloadWithOutstanding: is it OK to reload if there are outstanding methods?
//   headers: extra headers to send on the websockets connection, for
//     server-to-server DDP only
//   _sockjsOptions: Specifies options to pass through to the sockjs client
//   onDDPNegotiationVersionFailure: callback when version negotiation fails.
//
// XXX There should be a way to destroy a DDP connection, causing all
// outstanding method calls to fail.
//
// XXX Our current way of handling failure and reconnection is great
// for an app (where we want to tolerate being disconnected as an
// expect state, and keep trying forever to reconnect) but cumbersome
// for something like a command line tool that wants to make a
// connection, call a method, and print an error if connection
// fails. We should have better usability in the latter case (while
// still transparently reconnecting if it's just a transient failure
// or the server migrating us).
export class Connection {
	options: any;

	onReconnect: Function | null;

	_stream: any;

	_lastSessionId: string | null;

	_versionSuggestion: string | null;

	_version: string | null;

	_stores: Record<string, any>;

	_methodHandlers: Record<string, Function>;

	_nextMethodId: number;

	_supportedDDPVersions: string[];

	_heartbeatInterval: number;

	_heartbeatTimeout: number;

	_methodInvokers: Record<string, any>;

	_outstandingMethodBlocks: any[];

	_documentsWrittenByStub: Record<string, any>;

	_serverDocuments: Record<string, any>;

	_afterUpdateCallbacks: Function[];

	_messagesBufferedUntilQuiescence: any[];

	_methodsBlockingQuiescence: Record<string, boolean>;

	_subsBeingRevived: Record<string, boolean>;

	_resetStores: boolean;

	_updatesForUnknownStores: Record<string, any[]>;

	_retryMigrate: Function | null;

	_bufferedWrites: Record<string, any>;

	_bufferedWritesFlushAt: number | null;

	_bufferedWritesFlushHandle: any;

	_bufferedWritesInterval: number;

	_bufferedWritesMaxAge: number;

	_subscriptions: Record<string, any>;

	_userId: string | null;

	_userIdDeps: any;

	_streamHandlers: ConnectionStreamHandlers;

	_heartbeat: any;

	_messageProcessors: MessageProcessors;

	_livedata_connected: Function;

	_livedata_data: Function;

	_livedata_nosub: Function;

	_livedata_result: Function;

	_livedata_error: Function;

	_documentProcessors: DocumentProcessors;

	_process_added: Function;

	_process_changed: Function;

	_process_removed: Function;

	_process_ready: Function;

	_process_updated: Function;

	_pushUpdate: Function;

	_getServerDoc: Function;

	_liveDataWritesPromise: Promise<void> | undefined;

	constructor(url: string | any, _options: any) {
		const self = this;

		const options = {
			onConnected() {},
			onDDPVersionNegotiationFailure(description: string) {
				Meteor._debug(description);
			},
			heartbeatInterval: 17500,
			heartbeatTimeout: 15000,
			npmFayeOptions: Object.create(null),
			// These options are only for testing.
			reloadWithOutstanding: false,
			supportedDDPVersions: DDPCommon.SUPPORTED_DDP_VERSIONS,
			retry: true,
			respondToPings: true,
			// When updates are coming within this ms interval, batch them together.
			bufferedWritesInterval: 5,
			// Flush buffers immediately if writes are happening continuously for more than this many ms.
			bufferedWritesMaxAge: 500,

			..._options,
		};

		this.options = options;

		// If set, called when we reconnect, queuing method calls _before_ the
		// existing outstanding ones.
		// NOTE: This feature has been preserved for backwards compatibility. The
		// preferred method of setting a callback on reconnect is to use
		// DDP.onReconnect.
		self.onReconnect = null;

		// as a test hook, allow passing a stream instead of a url.
		if (typeof url === 'object') {
			self._stream = url;
		} else {
			self._stream = new ClientStream(url, {
				retry: options.retry,
				ConnectionError: DDP.ConnectionError,
				headers: options.headers,
				_sockjsOptions: options._sockjsOptions,
				// Used to keep some tests quiet, or for other cases in which
				// the right thing to do with connection errors is to silently
				// fail (e.g. sending package usage stats). At some point we
				// should have a real API for handling client-stream-level
				// errors.
				_dontPrintErrors: options._dontPrintErrors,
				connectTimeoutMs: options.connectTimeoutMs,
				npmFayeOptions: options.npmFayeOptions,
			});
		}

		self._lastSessionId = null;
		self._versionSuggestion = null; // The last proposed DDP version.
		self._version = null; // The DDP version agreed on by client and server.
		self._stores = Object.create(null); // name -> object with methods
		self._methodHandlers = Object.create(null); // name -> func
		self._nextMethodId = 1;
		self._supportedDDPVersions = options.supportedDDPVersions;

		self._heartbeatInterval = options.heartbeatInterval;
		self._heartbeatTimeout = options.heartbeatTimeout;

		// Tracks methods which the user has tried to call but which have not yet
		// called their user callback (ie, they are waiting on their result or for all
		// of their writes to be written to the local cache). Map from method ID to
		// MethodInvoker object.
		self._methodInvokers = Object.create(null);

		// Tracks methods which the user has called but whose result messages have not
		// arrived yet.
		//
		// _outstandingMethodBlocks is an array of blocks of methods. Each block
		// represents a set of methods that can run at the same time. The first block
		// represents the methods which are currently in flight; subsequent blocks
		// must wait for previous blocks to be fully finished before they can be sent
		// to the server.
		//
		// Each block is an object with the following fields:
		// - methods: a list of MethodInvoker objects
		// - wait: a boolean; if true, this block had a single method invoked with
		//         the "wait" option
		//
		// There will never be adjacent blocks with wait=false, because the only thing
		// that makes methods need to be serialized is a wait method.
		//
		// Methods are removed from the first block when their "result" is
		// received. The entire first block is only removed when all of the in-flight
		// methods have received their results (so the "methods" list is empty) *AND*
		// all of the data written by those methods are visible in the local cache. So
		// it is possible for the first block's methods list to be empty, if we are
		// still waiting for some objects to quiesce.
		//
		// Example:
		//  _outstandingMethodBlocks = [
		//    {wait: false, methods: []},
		//    {wait: true, methods: [<MethodInvoker for 'login'>]},
		//    {wait: false, methods: [<MethodInvoker for 'foo'>,
		//                            <MethodInvoker for 'bar'>]}]
		// This means that there were some methods which were sent to the server and
		// which have returned their results, but some of the data written by
		// the methods may not be visible in the local cache. Once all that data is
		// visible, we will send a 'login' method. Once the login method has returned
		// and all the data is visible (including re-running subs if userId changes),
		// we will send the 'foo' and 'bar' methods in parallel.
		self._outstandingMethodBlocks = [];

		// method ID -> array of objects with keys 'collection' and 'id', listing
		// documents written by a given method's stub. keys are associated with
		// methods whose stub wrote at least one document, and whose data-done message
		// has not yet been received.
		self._documentsWrittenByStub = {};
		// collection -> IdMap of "server document" object. A "server document" has:
		// - "document": the version of the document according the
		//   server (ie, the snapshot before a stub wrote it, amended by any changes
		//   received from the server)
		//   It is undefined if we think the document does not exist
		// - "writtenByStubs": a set of method IDs whose stubs wrote to the document
		//   whose "data done" messages have not yet been processed
		self._serverDocuments = {};

		// Array of callbacks to be called after the next update of the local
		// cache. Used for:
		//  - Calling methodInvoker.dataVisible and sub ready callbacks after
		//    the relevant data is flushed.
		//  - Invoking the callbacks of "half-finished" methods after reconnect
		//    quiescence. Specifically, methods whose result was received over the old
		//    connection (so we don't re-send it) but whose data had not been made
		//    visible.
		self._afterUpdateCallbacks = [];

		// In two contexts, we buffer all incoming data messages and then process them
		// all at once in a single update:
		//   - During reconnect, we buffer all data messages until all subs that had
		//     been ready before reconnect are ready again, and all methods that are
		//     active have returned their "data done message"; then
		//   - During the execution of a "wait" method, we buffer all data messages
		//     until the wait method gets its "data done" message. (If the wait method
		//     occurs during reconnect, it doesn't get any special handling.)
		// all data messages are processed in one update.
		//
		// The following fields are used for this "quiescence" process.

		// This buffers the messages that aren't being processed yet.
		self._messagesBufferedUntilQuiescence = [];
		// Map from method ID -> true. Methods are removed from this when their
		// "data done" message is received, and we will not quiesce until it is
		// empty.
		self._methodsBlockingQuiescence = {};
		// map from sub ID -> true for subs that were ready (ie, called the sub
		// ready callback) before reconnect but haven't become ready again yet
		self._subsBeingRevived = {}; // map from sub._id -> true
		// if true, the next data update should reset all stores. (set during
		// reconnect.)
		self._resetStores = false;

		// name -> array of updates for (yet to be created) collections
		self._updatesForUnknownStores = {};
		// if we're blocking a migration, the retry func
		self._retryMigrate = null;
		// Collection name -> array of messages.
		self._bufferedWrites = {};
		// When current buffer of updates must be flushed at, in ms timestamp.
		self._bufferedWritesFlushAt = null;
		// Timeout handle for the next processing of all pending writes
		self._bufferedWritesFlushHandle = null;

		self._bufferedWritesInterval = options.bufferedWritesInterval;
		self._bufferedWritesMaxAge = options.bufferedWritesMaxAge;

		// metadata for subscriptions.  Map from sub ID to object with keys:
		//   - id
		//   - name
		//   - params
		//   - inactive (if true, will be cleaned up if not reused in re-run)
		//   - ready (has the 'ready' message been received?)
		//   - readyCallback (an optional callback to call when ready)
		//   - errorCallback (an optional callback to call if the sub terminates with
		//                    an error, XXX COMPAT WITH 1.0.3.1)
		//   - stopCallback (an optional callback to call when the sub terminates
		//     for any reason, with an error argument if an error triggered the stop)
		self._subscriptions = {};

		// Reactive userId.
		self._userId = null;
		self._userIdDeps = new Tracker.Dependency();

		// Block auto-reload while we're waiting for method responses.
		if (Meteor.isClient && Package.reload && !options.reloadWithOutstanding) {
			Package.reload.Reload._onMigrate((retry: any) => {
				if (!self._readyToMigrate()) {
					self._retryMigrate = retry;
					return [false];
				}
				return [true];
			});
		}

		this._streamHandlers = new ConnectionStreamHandlers(this);

		const onDisconnect = () => {
			if (this._heartbeat) {
				this._heartbeat.stop();
				this._heartbeat = null;
			}
		};

		if (Meteor.isServer) {
			this._stream.on(
				'message',
				Meteor.bindEnvironment((msg: any) => this._streamHandlers.onMessage(msg), 'handling DDP message'),
			);
			this._stream.on(
				'reset',
				Meteor.bindEnvironment(() => this._streamHandlers.onReset(), 'handling DDP reset'),
			);
			this._stream.on('disconnect', Meteor.bindEnvironment(onDisconnect, 'handling DDP disconnect'));
		} else {
			this._stream.on('message', (msg: any) => this._streamHandlers.onMessage(msg));
			this._stream.on('reset', () => this._streamHandlers.onReset());
			this._stream.on('disconnect', onDisconnect);
		}

		this._messageProcessors = new MessageProcessors(this);

		// Expose message processor methods to maintain backward compatibility
		this._livedata_connected = (msg: any) => this._messageProcessors._livedata_connected(msg);
		this._livedata_data = (msg: any) => this._messageProcessors._livedata_data(msg);
		this._livedata_nosub = (msg: any) => this._messageProcessors._livedata_nosub(msg);
		this._livedata_result = (msg: any) => this._messageProcessors._livedata_result(msg);
		this._livedata_error = (msg: any) => this._messageProcessors._livedata_error(msg);

		this._documentProcessors = new DocumentProcessors(this);

		// Expose document processor methods to maintain backward compatibility
		this._process_added = (msg: any, updates: any) => this._documentProcessors._process_added(msg, updates);
		this._process_changed = (msg: any, updates: any) => this._documentProcessors._process_changed(msg, updates);
		this._process_removed = (msg: any, updates: any) => this._documentProcessors._process_removed(msg, updates);
		this._process_ready = (msg: any, updates: any) => this._documentProcessors._process_ready(msg, updates);
		this._process_updated = (msg: any, updates: any) => this._documentProcessors._process_updated(msg, updates);

		// Also expose utility methods used by other parts of the system
		this._pushUpdate = (updates: any, collection: string, msg: any) => this._documentProcessors._pushUpdate(updates, collection, msg);
		this._getServerDoc = (collection: string, id: string) => this._documentProcessors._getServerDoc(collection, id);
	}

	// 'name' is the name of the data on the wire that should go in the
	// store. 'wrappedStore' should be an object with methods beginUpdate, update,
	// endUpdate, saveOriginals, retrieveOriginals. see Collection for an example.
	createStoreMethods(name: string, wrappedStore: any) {
		const self = this;

		if (name in self._stores) return false;

		// Wrap the input object in an object which makes any store method not
		// implemented by 'store' into a no-op.
		const store: any = Object.create(null);
		const keysOfStore = ['update', 'beginUpdate', 'endUpdate', 'saveOriginals', 'retrieveOriginals', 'getDoc', '_getCollection'];
		keysOfStore.forEach((method) => {
			store[method] = (...args: any[]) => {
				if (wrappedStore[method]) {
					return wrappedStore[method](...args);
				}
			};
		});
		self._stores[name] = store;
		// Add _name prop to store
		store._name = name;
		return store;
	}

	registerStoreClient(name: string, wrappedStore: any) {
		const self = this;

		const store = self.createStoreMethods(name, wrappedStore);

		const queued = self._updatesForUnknownStores[name];
		if (Array.isArray(queued)) {
			store.beginUpdate(queued.length, false);
			queued.forEach((msg: any) => {
				store.update(msg);
			});
			store.endUpdate();
			delete self._updatesForUnknownStores[name];
		}

		return true;
	}

	async registerStoreServer(name: string, wrappedStore: any) {
		const self = this;

		const store = self.createStoreMethods(name, wrappedStore);

		const queued = self._updatesForUnknownStores[name];
		if (Array.isArray(queued)) {
			await store.beginUpdate(queued.length, false);
			for (const msg of queued) {
				await store.update(msg);
			}
			await store.endUpdate();
			delete self._updatesForUnknownStores[name];
		}

		return true;
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.subscribe
	 * @summary Subscribe to a record set.  Returns a handle that provides
	 * `stop()` and `ready()` methods.
	 * @locus Client
	 * @param {String} name Name of the subscription.  Matches the name of the
	 * server's `publish()` call.
	 * @param {EJSONable} [arg1,arg2...] Optional arguments passed to publisher
	 * function on server.
	 * @param {Function|Object} [callbacks] Optional. May include `onStop`
	 * and `onReady` callbacks. If there is an error, it is passed as an
	 * argument to `onStop`. If a function is passed instead of an object, it
	 * is interpreted as an `onReady` callback.
	 */
	subscribe(name: string /* .. [arguments] .. (callback|callbacks) */) {
		const self = this;

		const params = slice(arguments, 1);
		let callbacks: any = Object.create(null);
		if (params.length) {
			const lastParam = params[params.length - 1];
			if (typeof lastParam === 'function') {
				callbacks.onReady = params.pop();
			} else if (
				lastParam &&
				[
					lastParam.onReady,
					// XXX COMPAT WITH 1.0.3.1 onError used to exist, but now we use
					// onStop with an error callback instead.
					lastParam.onError,
					lastParam.onStop,
				].some((f: any) => typeof f === 'function')
			) {
				callbacks = params.pop();
			}
		}

		// Is there an existing sub with the same name and param, run in an
		// invalidated Computation? This will happen if we are rerunning an
		// existing computation.
		//
		// For example, consider a rerun of:
		//
		//     Tracker.autorun(function () {
		//       Meteor.subscribe("foo", Session.get("foo"));
		//       Meteor.subscribe("bar", Session.get("bar"));
		//     });
		//
		// If "foo" has changed but "bar" has not, we will match the "bar"
		// subcribe to an existing inactive subscription in order to not
		// unsub and resub the subscription unnecessarily.
		//
		// We only look for one such sub; if there are N apparently-identical subs
		// being invalidated, we will require N matching subscribe calls to keep
		// them all active.
		const existing = Object.values(self._subscriptions).find(
			(sub: any) => sub.inactive && sub.name === name && EJSON.equals(sub.params, params),
		);

		let id: string;
		if (existing) {
			id = existing.id;
			existing.inactive = false; // reactivate

			if (callbacks.onReady) {
				// If the sub is not already ready, replace any ready callback with the
				// one provided now. (It's not really clear what users would expect for
				// an onReady callback inside an autorun; the semantics we provide is
				// that at the time the sub first becomes ready, we call the last
				// onReady callback provided, if any.)
				// If the sub is already ready, run the ready callback right away.
				// It seems that users would expect an onReady callback inside an
				// autorun to trigger once the sub first becomes ready and also
				// when re-subs happens.
				if (existing.ready) {
					callbacks.onReady();
				} else {
					existing.readyCallback = callbacks.onReady;
				}
			}

			// XXX COMPAT WITH 1.0.3.1 we used to have onError but now we call
			// onStop with an optional error argument
			if (callbacks.onError) {
				// Replace existing callback if any, so that errors aren't
				// double-reported.
				existing.errorCallback = callbacks.onError;
			}

			if (callbacks.onStop) {
				existing.stopCallback = callbacks.onStop;
			}
		} else {
			// New sub! Generate an id, save it locally, and send message.
			id = Random.id();
			self._subscriptions[id] = {
				id,
				name,
				params: EJSON.clone(params),
				inactive: false,
				ready: false,
				readyDeps: new Tracker.Dependency(),
				readyCallback: callbacks.onReady,
				// XXX COMPAT WITH 1.0.3.1 #errorCallback
				errorCallback: callbacks.onError,
				stopCallback: callbacks.onStop,
				connection: self,
				remove() {
					delete this.connection._subscriptions[this.id];
					this.ready && this.readyDeps.changed();
				},
				stop() {
					this.connection._sendQueued({ msg: 'unsub', id });
					this.remove();

					if (callbacks.onStop) {
						callbacks.onStop();
					}
				},
			};
			self._send({ msg: 'sub', id, name, params });
		}

		// return a handle to the application.
		const handle = {
			stop() {
				if (!hasOwn(self._subscriptions, id)) {
					return;
				}
				self._subscriptions[id].stop();
			},
			ready() {
				// return false if we've unsubscribed.
				if (!hasOwn(self._subscriptions, id)) {
					return false;
				}
				const record = self._subscriptions[id];
				record.readyDeps.depend();
				return record.ready;
			},
			subscriptionId: id,
		};

		if (Tracker.active) {
			// We're in a reactive computation, so we'd like to unsubscribe when the
			// computation is invalidated... but not if the rerun just re-subscribes
			// to the same subscription!  When a rerun happens, we use onInvalidate
			// as a change to mark the subscription "inactive" so that it can
			// be reused from the rerun.  If it isn't reused, it's killed from
			// an afterFlush.
			Tracker.onInvalidate((c) => {
				if (hasOwn(self._subscriptions, id)) {
					self._subscriptions[id].inactive = true;
				}

				Tracker.afterFlush(() => {
					if (hasOwn(self._subscriptions, id) && self._subscriptions[id].inactive) {
						handle.stop();
					}
				});
			});
		}

		return handle;
	}

	/**
	 * @summary Tells if the method call came from a call or a callAsync.
	 * @alias Meteor.isAsyncCall
	 * @locus Anywhere
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @returns boolean
	 */
	isAsyncCall() {
		return DDP._CurrentMethodInvocation._isCallAsyncMethodRunning();
	}

	methods(methods: Record<string, Function>) {
		Object.entries(methods).forEach(([name, func]) => {
			if (typeof func !== 'function') {
				throw new Error(`Method '${name}' must be a function`);
			}
			if (this._methodHandlers[name]) {
				throw new Error(`A method named '${name}' is already defined`);
			}
			this._methodHandlers[name] = func;
		});
	}

	_getIsSimulation({ isFromCallAsync, alreadyInSimulation }: any) {
		if (!isFromCallAsync) {
			return alreadyInSimulation;
		}
		return alreadyInSimulation && DDP._CurrentMethodInvocation._isCallAsyncMethodRunning();
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.call
	 * @summary Invokes a method with a sync stub, passing any number of arguments.
	 * @locus Anywhere
	 * @param name Name of method to invoke
	 * @param args Optional method arguments
	 * @param {Function} [asyncCallback] Optional callback, which is called asynchronously with the error or result after the method is complete. If not provided, the method runs synchronously if possible (see below).
	 */
	call(name: string, ...args: [...EJSONable[], UnknownFunction]): any {
		// if it's a function, the last argument is the result callback,
		// not a parameter to the remote method.
		let callback;
		if (args.length && typeof args[args.length - 1] === 'function') {
			callback = args.pop();
		}
		return this.apply(name, args, callback);
	}

	/**
	 * @summary Invokes a method with an async stub, passing any number of arguments.
	 * @param name Name of method to invoke
	 * @param args Optional method arguments
	 */
	callAsync(name: string, ...args: EJSONable[]): Promise<any> {
		if (args.length && typeof args[args.length - 1] === 'function') {
			throw new Error("Meteor.callAsync() does not accept a callback. You should 'await' the result, or use .then().");
		}

		return this.applyAsync(name, args, { returnServerResultPromise: true });
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.apply
	 * @summary Invoke a method passing an array of arguments.
	 * @locus Anywhere
	 * @param {String} name Name of method to invoke
	 * @param {EJSONable[]} args Method arguments
	 * @param {Object} [options]
	 * @param {Boolean} options.wait (Client only) If true, don't send this method until all previous method calls have completed, and don't send any subsequent method calls until this one is completed.
	 * @param {Function} options.onResultReceived (Client only) This callback is invoked with the error or result of the method (just like `asyncCallback`) as soon as the error or result is available. The local cache may not yet reflect the writes performed by the method.
	 * @param {Boolean} options.noRetry (Client only) if true, don't send this method again on reload, simply call the callback an error with the error code 'invocation-failed'.
	 * @param {Boolean} options.throwStubExceptions (Client only) If true, exceptions thrown by method stubs will be thrown instead of logged, and the method will not be invoked on the server.
	 * @param {Boolean} options.returnStubValue (Client only) If true then in cases where we would have otherwise discarded the stub's return value and returned undefined, instead we go ahead and return it. Specifically, this is any time other than when (a) we are already inside a stub or (b) we are in Node and no callback was provided. Currently we require this flag to be explicitly passed to reduce the likelihood that stub return values will be confused with server return values; we may improve this in future.
	 * @param {Function} [asyncCallback] Optional callback; same semantics as in [`Meteor.call`](#meteor_call).
	 */
	apply(name: string, args: any[], options?: any, callback?: Function) {
		const { stubInvocation, invocation, ...stubOptions } = this._stubCall(name, EJSON.clone(args), options);

		if (stubOptions.hasStub) {
			if (
				!this._getIsSimulation({
					alreadyInSimulation: stubOptions.alreadyInSimulation,
					isFromCallAsync: stubOptions.isFromCallAsync,
				})
			) {
				this._saveOriginals();
			}
			try {
				stubOptions.stubReturnValue = DDP._CurrentMethodInvocation.withValue(invocation, stubInvocation);
				if (Meteor._isPromise(stubOptions.stubReturnValue)) {
					Meteor._debug(
						`Method ${name}: Calling a method that has an async method stub with call/apply can lead to unexpected behaviors. Use callAsync/applyAsync instead.`,
					);
				}
			} catch (e) {
				stubOptions.exception = e;
			}
		}
		return this._apply(name, stubOptions, args, options, callback);
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.applyAsync
	 * @summary Invoke a method passing an array of arguments.
	 * @locus Anywhere
	 * @param {String} name Name of method to invoke
	 * @param {EJSONable[]} args Method arguments
	 * @param {Object} [options]
	 * @param {Boolean} options.wait (Client only) If true, don't send this method until all previous method calls have completed, and don't send any subsequent method calls until this one is completed.
	 * @param {Function} options.onResultReceived (Client only) This callback is invoked with the error or result of the method (just like `asyncCallback`) as soon as the error or result is available. The local cache may not yet reflect the writes performed by the method.
	 * @param {Boolean} options.noRetry (Client only) if true, don't send this method again on reload, simply call the callback an error with the error code 'invocation-failed'.
	 * @param {Boolean} options.throwStubExceptions (Client only) If true, exceptions thrown by method stubs will be thrown instead of logged, and the method will not be invoked on the server.
	 * @param {Boolean} options.returnStubValue (Client only) If true then in cases where we would have otherwise discarded the stub's return value and returned undefined, instead we go ahead and return it. Specifically, this is any time other than when (a) we are already inside a stub or (b) we are in Node and no callback was provided. Currently we require this flag to be explicitly passed to reduce the likelihood that stub return values will be confused with server return values; we may improve this in future.
	 * @param {Boolean} options.returnServerResultPromise (Client only) If true, the promise returned by applyAsync will resolve to the server's return value, rather than the stub's return value. This is useful when you want to ensure that the server's return value is used, even if the stub returns a promise. The same behavior as `callAsync`.
	 */
	applyAsync(name: string, args: any[], options: any, callback: Function | null | undefined = null) {
		const stubPromise = this._applyAsyncStubInvocation(name, args, options);

		const promise: any = this._applyAsync({
			name,
			args,
			options,
			callback,
			stubPromise,
		});
		if (Meteor.isClient) {
			// only return the stubReturnValue
			promise.stubPromise = stubPromise.then((o: any) => {
				if (o.exception) {
					throw o.exception;
				}
				return o.stubReturnValue;
			});
			// this avoids attribute recursion
			promise.serverPromise = new Promise((resolve, reject) => promise.then(resolve).catch(reject));
		}
		return promise;
	}

	async _applyAsyncStubInvocation(name: string, args: any[], options: any) {
		const { stubInvocation, invocation, ...stubOptions } = this._stubCall(name, EJSON.clone(args), options);
		if (stubOptions.hasStub) {
			if (
				!this._getIsSimulation({
					alreadyInSimulation: stubOptions.alreadyInSimulation,
					isFromCallAsync: stubOptions.isFromCallAsync,
				})
			) {
				this._saveOriginals();
			}
			try {
				/*
				 * The code below follows the same logic as the function withValues().
				 *
				 * But as the Meteor package is not compiled by ecmascript, it is unable to use newer syntax in the browser,
				 * such as, the async/await.
				 *
				 * So, to keep supporting old browsers, like IE 11, we're creating the logic one level above.
				 */
				const currentContext = DDP._CurrentMethodInvocation._setNewContextAndGetCurrent(invocation);
				try {
					stubOptions.stubReturnValue = await stubInvocation();
				} catch (e) {
					stubOptions.exception = e;
				} finally {
					DDP._CurrentMethodInvocation._set(currentContext);
				}
			} catch (e) {
				stubOptions.exception = e;
			}
		}
		return stubOptions;
	}

	async _applyAsync({ name, args, options, callback, stubPromise }: any) {
		const stubOptions = await stubPromise;
		return this._apply(name, stubOptions, args, options, callback);
	}

	_apply(name: string, stubCallValue: any, args: any[], options: any, callback: Function | null | undefined) {
		const self = this;

		// We were passed 3 arguments. They may be either (name, args, options)
		// or (name, args, callback)
		if (!callback && typeof options === 'function') {
			callback = options;
			options = Object.create(null);
		}
		options = options || Object.create(null);

		if (callback) {
			// XXX would it be better form to do the binding in stream.on,
			// or caller, instead of here?
			// XXX improve error message (and how we report it)
			callback = Meteor.bindEnvironment(callback, `delivering result of invoking '${name}'`);
		}
		const { hasStub, exception, stubReturnValue, alreadyInSimulation, randomSeed } = stubCallValue;

		// Keep our args safe from mutation (eg if we don't send the message for a
		// while because of a wait method).
		args = EJSON.clone(args);
		// If we're in a simulation, stop and return the result we have,
		// rather than going on to do an RPC. If there was no stub,
		// we'll end up returning undefined.
		if (
			this._getIsSimulation({
				alreadyInSimulation,
				isFromCallAsync: stubCallValue.isFromCallAsync,
			})
		) {
			let result;

			if (callback) {
				callback(exception, stubReturnValue);
			} else {
				if (exception) throw exception;
				result = stubReturnValue;
			}

			return options._returnMethodInvoker ? { result } : result;
		}

		// We only create the methodId here because we don't actually need one if
		// we're already in a simulation
		const methodId = `${self._nextMethodId++}`;
		if (hasStub) {
			self._retrieveAndStoreOriginals(methodId);
		}

		// Generate the DDP message for the method call. Note that on the client,
		// it is important that the stub have finished before we send the RPC, so
		// that we know we have a complete list of which local documents the stub
		// wrote.
		const message: any = {
			msg: 'method',
			id: methodId,
			method: name,
			params: args,
		};

		// If an exception occurred in a stub, and we're ignoring it
		// because we're doing an RPC and want to use what the server
		// returns instead, log it so the developer knows
		// (unless they explicitly ask to see the error).
		//
		// Tests can set the '_expectedByTest' flag on an exception so it won't
		// go to log.
		if (exception) {
			if (options.throwStubExceptions) {
				throw exception;
			} else if (!exception._expectedByTest) {
				Meteor._debug(`Exception while simulating the effect of invoking '${name}'`, exception);
			}
		}

		// At this point we're definitely doing an RPC, and we're going to
		// return the value of the RPC to the caller.

		// If the caller didn't give a callback, decide what to do.
		let promise;
		if (!callback) {
			if (Meteor.isClient && !options.returnServerResultPromise && (!options.isFromCallAsync || options.returnStubValue)) {
				callback = (err: any) => {
					err && Meteor._debug(`Error invoking Method '${name}'`, err);
				};
			} else {
				promise = new Promise((resolve, reject) => {
					callback = (...allArgs: any[]) => {
						const args = Array.from(allArgs);
						const err = args.shift();
						if (err) {
							reject(err);
							return;
						}
						resolve(...args);
					};
				});
			}
		}

		// Send the randomSeed only if we used it
		if (randomSeed.value !== null) {
			message.randomSeed = randomSeed.value;
		}

		const methodInvoker = new MethodInvoker({
			methodId,
			callback,
			connection: self,
			onResultReceived: options.onResultReceived,
			wait: !!options.wait,
			message,
			noRetry: !!options.noRetry,
		});

		let result;

		if (promise) {
			result = options.returnStubValue ? promise.then(() => stubReturnValue) : promise;
		} else {
			result = options.returnStubValue ? stubReturnValue : undefined;
		}

		if (options._returnMethodInvoker) {
			return {
				methodInvoker,
				result,
			};
		}

		self._addOutstandingMethod(methodInvoker, options);
		return result;
	}

	_stubCall(name: string, args: any[], options?: any) {
		// Run the stub, if we have one. The stub is supposed to make some
		// temporary writes to the database to give the user a smooth experience
		// until the actual result of executing the method comes back from the
		// server (whereupon the temporary writes to the database will be reversed
		// during the beginUpdate/endUpdate process.)
		//
		// Normally, we ignore the return value of the stub (even if it is an
		// exception), in favor of the real return value from the server. The
		// exception is if the *caller* is a stub. In that case, we're not going
		// to do a RPC, so we use the return value of the stub as our return
		// value.
		const self = this;
		const enclosing = DDP._CurrentMethodInvocation.get();
		const stub = self._methodHandlers[name];
		const alreadyInSimulation = enclosing?.isSimulation;
		const isFromCallAsync = enclosing?._isFromCallAsync;
		const randomSeed: any = { value: null };

		const defaultReturn = {
			alreadyInSimulation,
			randomSeed,
			isFromCallAsync,
		};
		if (!stub) {
			return { ...defaultReturn, hasStub: false };
		}

		// Lazily generate a randomSeed, only if it is requested by the stub.
		// The random streams only have utility if they're used on both the client
		// and the server; if the client doesn't generate any 'random' values
		// then we don't expect the server to generate any either.
		// Less commonly, the server may perform different actions from the client,
		// and may in fact generate values where the client did not, but we don't
		// have any client-side values to match, so even here we may as well just
		// use a random seed on the server.  In that case, we don't pass the
		// randomSeed to save bandwidth, and we don't even generate it to save a
		// bit of CPU and to avoid consuming entropy.

		const randomSeedGenerator = () => {
			if (randomSeed.value === null) {
				randomSeed.value = DDPCommon.makeRpcSeed(enclosing, name);
			}
			return randomSeed.value;
		};

		const setUserId = (userId: string) => {
			self.setUserId(userId);
		};

		const invocation = new DDPCommon.MethodInvocation({
			name,
			isSimulation: true,
			userId: self.userId(),
			isFromCallAsync: options?.isFromCallAsync,
			setUserId,
			randomSeed() {
				return randomSeedGenerator();
			},
		});

		// Note that unlike in the corresponding server code, we never audit
		// that stubs check() their arguments.
		const stubInvocation = () => {
			if (Meteor.isServer) {
				// Because saveOriginals and retrieveOriginals aren't reentrant,
				// don't allow stubs to yield.
				return Meteor._noYieldsAllowed(() => {
					// re-clone, so that the stub can't affect our caller's values
					return stub.apply(invocation, EJSON.clone(args));
				});
			}
			return stub.apply(invocation, EJSON.clone(args));
		};
		return { ...defaultReturn, hasStub: true, stubInvocation, invocation };
	}

	// Before calling a method stub, prepare all stores to track changes and allow
	// _retrieveAndStoreOriginals to get the original versions of changed
	// documents.
	_saveOriginals() {
		if (!this._waitingForQuiescence()) {
			this._flushBufferedWrites();
		}

		Object.values(this._stores).forEach((store) => {
			store.saveOriginals();
		});
	}

	// Retrieves the original versions of all documents modified by the stub for
	// method 'methodId' from all stores and saves them to _serverDocuments (keyed
	// by document) and _documentsWrittenByStub (keyed by method ID).
	_retrieveAndStoreOriginals(methodId: string) {
		const self = this;
		if (self._documentsWrittenByStub[methodId]) throw new Error('Duplicate methodId in _retrieveAndStoreOriginals');

		const docsWritten: any[] = [];

		Object.entries(self._stores).forEach(([collection, store]: [string, any]) => {
			const originals = store.retrieveOriginals();
			// not all stores define retrieveOriginals
			if (!originals) return;
			originals.forEach((doc: any, id: string) => {
				docsWritten.push({ collection, id });
				if (!hasOwn(self._serverDocuments, collection)) {
					self._serverDocuments[collection] = new MongoIDMap();
				}
				const serverDoc = self._serverDocuments[collection].setDefault(id, Object.create(null));
				if (serverDoc.writtenByStubs) {
					// We're not the first stub to write this doc. Just add our method ID
					// to the record.
					serverDoc.writtenByStubs[methodId] = true;
				} else {
					// First stub! Save the original value and our method ID.
					serverDoc.document = doc;
					serverDoc.flushCallbacks = [];
					serverDoc.writtenByStubs = Object.create(null);
					serverDoc.writtenByStubs[methodId] = true;
				}
			});
		});
		if (!isEmpty(docsWritten)) {
			self._documentsWrittenByStub[methodId] = docsWritten;
		}
	}

	// This is very much a private function we use to make the tests
	// take up fewer server resources after they complete.
	_unsubscribeAll() {
		Object.values(this._subscriptions).forEach((sub: any) => {
			// Avoid killing the autoupdate subscription so that developers
			// still get hot code pushes when writing tests.
			//
			// XXX it's a hack to encode knowledge about autoupdate here,
			// but it doesn't seem worth it yet to have a special API for
			// subscriptions to preserve after unit tests.
			if (sub.name !== 'meteor_autoupdate_clientVersions') {
				sub.stop();
			}
		});
	}

	// Sends the DDP stringification of the given message object
	_send(obj: any, _queue = false) {
		this._stream.send(DDPCommon.stringifyDDP(obj));
	}

	// Always queues the call before sending the message
	// Used, for example, on subscription.[id].stop() to make sure a "sub" message is always called before an "unsub" message
	// https://github.com/meteor/meteor/issues/13212
	//
	// This is part of the actual fix for the rest check:
	// https://github.com/meteor/meteor/pull/13236
	_sendQueued(obj: any) {
		this._send(obj, true);
	}

	// We detected via DDP-level heartbeats that we've lost the
	// connection.  Unlike `disconnect` or `close`, a lost connection
	// will be automatically retried.
	_lostConnection(error: any) {
		this._stream._lostConnection(error);
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.status
	 * @summary Get the current connection status. A reactive data source.
	 * @locus Client
	 */
	status(...args: any[]) {
		return this._stream.status(...args);
	}

	/**
   * @summary Force an immediate reconnection attempt if the client is not connected to the server.

  This method does nothing if the client is already connected.
   * @memberOf Meteor
   * @importFromPackage meteor
   * @alias Meteor.reconnect
   * @locus Client
   */
	reconnect(...args: any[]) {
		return this._stream.reconnect(...args);
	}

	/**
	 * @memberOf Meteor
	 * @importFromPackage meteor
	 * @alias Meteor.disconnect
	 * @summary Disconnect the client from the server.
	 * @locus Client
	 */
	disconnect(...args: any[]) {
		return this._stream.disconnect(...args);
	}

	close() {
		return this._stream.disconnect({ _permanent: true });
	}

	// /
	// / Reactive user system
	// /
	userId() {
		if (this._userIdDeps) this._userIdDeps.depend();
		return this._userId;
	}

	setUserId(userId: string | null) {
		// Avoid invalidating dependents if setUserId is called with current value.
		if (this._userId === userId) return;
		this._userId = userId;
		if (this._userIdDeps) this._userIdDeps.changed();
	}

	// Returns true if we are in a state after reconnect of waiting for subs to be
	// revived or early methods to finish their data, or we are waiting for a
	// "wait" method to finish.
	_waitingForQuiescence() {
		return !isEmpty(this._subsBeingRevived) || !isEmpty(this._methodsBlockingQuiescence);
	}

	// Returns true if any method whose message has been sent to the server has
	// not yet invoked its user callback.
	_anyMethodsAreOutstanding() {
		const invokers = this._methodInvokers;
		return Object.values(invokers).some((invoker: any) => !!invoker.sentMessage);
	}

	async _processOneDataMessage(msg: any, updates: any) {
		const messageType = msg.msg;

		// msg is one of ['added', 'changed', 'removed', 'ready', 'updated']
		if (messageType === 'added') {
			await this._process_added(msg, updates);
		} else if (messageType === 'changed') {
			this._process_changed(msg, updates);
		} else if (messageType === 'removed') {
			this._process_removed(msg, updates);
		} else if (messageType === 'ready') {
			this._process_ready(msg, updates);
		} else if (messageType === 'updated') {
			this._process_updated(msg, updates);
		} else if (messageType === 'nosub') {
			// ignore this
		} else {
			Meteor._debug('discarding unknown livedata data message type', msg);
		}
	}

	_prepareBuffersToFlush() {
		const self = this;
		if (self._bufferedWritesFlushHandle) {
			clearTimeout(self._bufferedWritesFlushHandle);
			self._bufferedWritesFlushHandle = null;
		}

		self._bufferedWritesFlushAt = null;
		// We need to clear the buffer before passing it to
		//  performWrites. As there's no guarantee that it
		//  will exit cleanly.
		const writes = self._bufferedWrites;
		self._bufferedWrites = Object.create(null);
		return writes;
	}

	/**
	 * Server-side store updates handled asynchronously
	 * @private
	 */
	async _performWritesServer(updates: any) {
		const self = this;

		if (self._resetStores || !isEmpty(updates)) {
			// Start all store updates - keeping original loop structure
			for (const store of Object.values(self._stores)) {
				await store.beginUpdate(updates[store._name]?.length || 0, self._resetStores);
			}

			self._resetStores = false;

			// Process each store's updates sequentially as before
			for (const [storeName, messages] of Object.entries(updates)) {
				const store = self._stores[storeName];
				if (store) {
					// Batch each store's messages in modest chunks to prevent event loop blocking
					// while maintaining operation order
					const CHUNK_SIZE = 100;
					for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
						const chunk = messages.slice(i, Math.min(i + CHUNK_SIZE, messages.length));

						for (const msg of chunk) {
							await store.update(msg);
						}

						await new Promise((resolve) => process.nextTick(resolve));
					}
				} else {
					// Queue updates for uninitialized stores
					self._updatesForUnknownStores[storeName] = self._updatesForUnknownStores[storeName] || [];
					self._updatesForUnknownStores[storeName].push(...messages);
				}
			}

			// Complete all updates
			for (const store of Object.values(self._stores)) {
				await store.endUpdate();
			}
		}

		self._runAfterUpdateCallbacks();
	}

	/**
	 * Client-side store updates handled synchronously for optimistic UI
	 * @private
	 */
	_performWritesClient(updates: any) {
		const self = this;

		if (self._resetStores || !isEmpty(updates)) {
			// Synchronous store updates for client
			Object.values(self._stores).forEach((store) => {
				store.beginUpdate(updates[store._name]?.length || 0, self._resetStores);
			});

			self._resetStores = false;

			Object.entries(updates).forEach(([storeName, messages]) => {
				const store = self._stores[storeName];
				if (store) {
					messages.forEach((msg) => store.update(msg));
				} else {
					self._updatesForUnknownStores[storeName] = self._updatesForUnknownStores[storeName] || [];
					self._updatesForUnknownStores[storeName].push(...messages);
				}
			});

			Object.values(self._stores).forEach((store) => store.endUpdate());
		}

		self._runAfterUpdateCallbacks();
	}

	/**
	 * Executes buffered writes either synchronously (client) or async (server)
	 * @private
	 */
	async _flushBufferedWrites() {
		const self = this;
		const writes = self._prepareBuffersToFlush();

		return Meteor.isClient ? self._performWritesClient(writes) : self._performWritesServer(writes);
	}

	// Call any callbacks deferred with _runWhenAllServerDocsAreFlushed whose
	// relevant docs have been flushed, as well as dataVisible callbacks at
	// reconnect-quiescence time.
	_runAfterUpdateCallbacks() {
		const self = this;
		const callbacks = self._afterUpdateCallbacks;
		self._afterUpdateCallbacks = [];
		callbacks.forEach((c: any) => {
			c();
		});
	}

	// Ensures that "f" will be called after all documents currently in
	// _serverDocuments have been written to the local cache. f will not be called
	// if the connection is lost before then!
	_runWhenAllServerDocsAreFlushed(f: Function) {
		const self = this;
		const runFAfterUpdates = () => {
			self._afterUpdateCallbacks.push(f);
		};
		let unflushedServerDocCount = 0;
		const onServerDocFlush = () => {
			--unflushedServerDocCount;
			if (unflushedServerDocCount === 0) {
				// This was the last doc to flush! Arrange to run f after the updates
				// have been applied.
				runFAfterUpdates();
			}
		};

		Object.values(self._serverDocuments).forEach((serverDocuments: any) => {
			serverDocuments.forEach((serverDoc: any) => {
				const writtenByStubForAMethodWithSentMessage = keys(serverDoc.writtenByStubs).some((methodId) => {
					const invoker = self._methodInvokers[methodId];
					return invoker && invoker.sentMessage;
				});

				if (writtenByStubForAMethodWithSentMessage) {
					++unflushedServerDocCount;
					serverDoc.flushCallbacks.push(onServerDocFlush);
				}
			});
		});
		if (unflushedServerDocCount === 0) {
			// There aren't any buffered docs --- we can call f as soon as the current
			// round of updates is applied!
			runFAfterUpdates();
		}
	}

	_addOutstandingMethod(methodInvoker: any, options: any) {
		if (options?.wait) {
			// It's a wait method! Wait methods go in their own block.
			this._outstandingMethodBlocks.push({
				wait: true,
				methods: [methodInvoker],
			});
		} else {
			// Not a wait method. Start a new block if the previous block was a wait
			// block, and add it to the last block of methods.
			if (isEmpty(this._outstandingMethodBlocks) || last(this._outstandingMethodBlocks).wait) {
				this._outstandingMethodBlocks.push({
					wait: false,
					methods: [],
				});
			}

			last(this._outstandingMethodBlocks).methods.push(methodInvoker);
		}

		// If we added it to the first block, send it out now.
		if (this._outstandingMethodBlocks.length === 1) {
			methodInvoker.sendMessage();
		}
	}

	// Called by MethodInvoker after a method's callback is invoked.  If this was
	// the last outstanding method in the current block, runs the next block. If
	// there are no more methods, consider accepting a hot code push.
	_outstandingMethodFinished() {
		const self = this;
		if (self._anyMethodsAreOutstanding()) return;

		// No methods are outstanding. This should mean that the first block of
		// methods is empty. (Or it might not exist, if this was a method that
		// half-finished before disconnect/reconnect.)
		if (!isEmpty(self._outstandingMethodBlocks)) {
			const firstBlock = self._outstandingMethodBlocks.shift();
			if (!isEmpty(firstBlock.methods)) throw new Error(`No methods outstanding but nonempty block: ${JSON.stringify(firstBlock)}`);

			// Send the outstanding methods now in the first block.
			if (!isEmpty(self._outstandingMethodBlocks)) self._sendOutstandingMethods();
		}

		// Maybe accept a hot code push.
		self._maybeMigrate();
	}

	// Sends messages for all the methods in the first block in
	// _outstandingMethodBlocks.
	_sendOutstandingMethods() {
		const self = this;

		if (isEmpty(self._outstandingMethodBlocks)) {
			return;
		}

		self._outstandingMethodBlocks[0].methods.forEach((m: any) => {
			m.sendMessage();
		});
	}

	_sendOutstandingMethodBlocksMessages(oldOutstandingMethodBlocks: any[]) {
		const self = this;
		if (isEmpty(oldOutstandingMethodBlocks)) return;

		// We have at least one block worth of old outstanding methods to try
		// again. First: did onReconnect actually send anything? If not, we just
		// restore all outstanding methods and run the first block.
		if (isEmpty(self._outstandingMethodBlocks)) {
			self._outstandingMethodBlocks = oldOutstandingMethodBlocks;
			self._sendOutstandingMethods();
			return;
		}

		// OK, there are blocks on both sides. Special case: merge the last block of
		// the reconnect methods with the first block of the original methods, if
		// neither of them are "wait" blocks.
		if (!last(self._outstandingMethodBlocks).wait && !oldOutstandingMethodBlocks[0].wait) {
			oldOutstandingMethodBlocks[0].methods.forEach((m) => {
				last(self._outstandingMethodBlocks).methods.push(m);

				// If this "last block" is also the first block, send the message.
				if (self._outstandingMethodBlocks.length === 1) {
					m.sendMessage();
				}
			});

			oldOutstandingMethodBlocks.shift();
		}

		// Now add the rest of the original blocks on.
		self._outstandingMethodBlocks.push(...oldOutstandingMethodBlocks);
	}

	_callOnReconnectAndSendAppropriateOutstandingMethods() {
		const self = this;
		const oldOutstandingMethodBlocks = self._outstandingMethodBlocks;
		self._outstandingMethodBlocks = [];

		self.onReconnect && self.onReconnect();
		DDP._reconnectHook.each((callback: Function) => {
			callback(self);
			return true;
		});

		self._sendOutstandingMethodBlocksMessages(oldOutstandingMethodBlocks);
	}

	// We can accept a hot code push if there are no methods in flight.
	_readyToMigrate() {
		return isEmpty(this._methodInvokers);
	}

	// If we were blocking a migration, see if it's now possible to continue.
	// Call whenever the set of outstanding/blocked methods shrinks.
	_maybeMigrate() {
		const self = this;
		if (self._retryMigrate && self._readyToMigrate()) {
			self._retryMigrate();
			self._retryMigrate = null;
		}
	}
}

// This array allows the `_allSubscriptionsReady` method below, which
// is used by the `spiderable` package, to keep track of whether all
// data is ready.
const allConnections: Connection[] = [];

/**
 * @namespace DDP
 * @summary Namespace for DDP-related methods/classes.
 */
export const DDP: any = {};

// This is private but it's used in a few places. accounts-base uses
// it to get the current user. Meteor.setTimeout and friends clear
// it. We can probably find a better way to factor this.
DDP._CurrentMethodInvocation = new Meteor.EnvironmentVariable();
DDP._CurrentPublicationInvocation = new Meteor.EnvironmentVariable();

// XXX: Keep DDP._CurrentInvocation for backwards-compatibility.
DDP._CurrentInvocation = DDP._CurrentMethodInvocation;

DDP._CurrentCallAsyncInvocation = new Meteor.EnvironmentVariable();

// This is passed into a weird `makeErrorType` function that expects its thing
// to be a constructor
function connectionErrorConstructor(this: any, message: string) {
	this.message = message;
}

DDP.ConnectionError = Meteor.makeErrorType('DDP.ConnectionError', connectionErrorConstructor);

DDP.ForcedReconnectError = Meteor.makeErrorType('DDP.ForcedReconnectError', () => {});

// Returns the named sequence of pseudo-random values.
// The scope will be DDP._CurrentMethodInvocation.get(), so the stream will produce
// consistent values for method calls on the client and server.
DDP.randomStream = (name: string) => {
	const scope = DDP._CurrentMethodInvocation.get();
	return DDPCommon.RandomStream.get(scope, name);
};

// @param url {String} URL to Meteor app,
//     e.g.:
//     "subdomain.meteor.com",
//     "http://subdomain.meteor.com",
//     "/",
//     "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"

/**
 * @summary Connect to the server of a different Meteor application to subscribe to its document sets and invoke its remote methods.
 * @locus Anywhere
 * @param {String} url The URL of another Meteor application.
 * @param {Object} [options]
 * @param {Boolean} options.reloadWithOutstanding is it OK to reload if there are outstanding methods?
 * @param {Object} options.headers extra headers to send on the websockets connection, for server-to-server DDP only
 * @param {Object} options._sockjsOptions Specifies options to pass through to the sockjs client
 * @param {Function} options.onDDPNegotiationVersionFailure callback when version negotiation fails.
 */
DDP.connect = (url: string, options: any) => {
	const ret = new Connection(url, options);
	allConnections.push(ret); // hack. see below.
	return ret;
};

DDP._reconnectHook = new Hook({ bindEnvironment: false });

/**
 * @summary Register a function to call as the first step of
 * reconnecting. This function can call methods which will be executed before
 * any other outstanding methods. For example, this can be used to re-establish
 * the appropriate authentication context on the connection.
 * @locus Anywhere
 * @param {Function} callback The function to call. It will be called with a
 * single argument, the [connection object](#ddp_connect) that is reconnecting.
 */
DDP.onReconnect = (callback: Function) => DDP._reconnectHook.register(callback);

// Hack for `spiderable` package: a way to see if the page is done
// loading all the data it needs.
//
DDP._allSubscriptionsReady = () => allConnections.every((conn) => Object.values(conn._subscriptions).every((sub: any) => sub.ready));

let queueSize = 0;
let queue = Promise.resolve();

export const loadAsyncStubHelpers = () => {
	function queueFunction(fn: any, promiseProps: any = {}) {
		queueSize += 1;

		let resolve;
		let reject;
		const promise: any = new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});

		queue = queue.finally(() => {
			fn(resolve, reject);

			return promise.stubPromise?.catch(() => {}); // silent uncaught promise
		});

		promise
			.catch(() => {}) // silent uncaught promise
			.finally(() => {
				queueSize -= 1;
				if (queueSize === 0) {
					Meteor.connection._maybeMigrate();
				}
			});

		promise.stubPromise = promiseProps.stubPromise;
		promise.serverPromise = promiseProps.serverPromise;

		return promise;
	}

	const oldReadyToMigrate = Connection.prototype._readyToMigrate;
	Connection.prototype._readyToMigrate = function (this: any) {
		if (queueSize > 0) {
			return false;
		}

		return oldReadyToMigrate.apply(this, arguments as any);
	};

	let currentMethodInvocation: any = null;

	/**
	 * Meteor sets CurrentMethodInvocation to undefined for the reasons explained at
	 * https://github.com/meteor/meteor/blob/c9e3551b9673a7ed607f18cb1128563ff49ca96f/packages/ddp-client/common/livedata_connection.js#L578-L605
	 * The app code could call `.then` on a promise while the async stub is running,
	 * causing the `then` callback to think it is inside the stub.
	 *
	 * With the queueing we are doing, this is no longer necessary. The point
	 * of the queueing is to prevent app/package code from running while
	 * the stub is running, so we don't need to worry about this.
	 */

	const oldApplyAsync = Connection.prototype.applyAsync;
	Connection.prototype.applyAsync = function (this: any, ...args: any[]) {
		const name = args[0];

		if (currentMethodInvocation) {
			DDP._CurrentMethodInvocation._set(currentMethodInvocation);
			currentMethodInvocation = null;
		}

		const enclosing = DDP._CurrentMethodInvocation.get();
		const alreadyInSimulation = enclosing?.isSimulation;
		const isFromCallAsync = enclosing?._isFromCallAsync;

		if (
			Meteor.connection._getIsSimulation({
				isFromCallAsync,
				alreadyInSimulation,
			})
		) {
			// In stub - call immediately
			return oldApplyAsync.apply(this, args);
		}

		let stubPromiseResolver: any;
		let serverPromiseResolver: any;
		const stubPromise = new Promise((r) => (stubPromiseResolver = r));
		const serverPromise = new Promise((r) => (serverPromiseResolver = r));

		return queueFunction(
			(resolve: Function, reject: Function) => {
				let finished = false;

				Meteor._setImmediate(() => {
					const applyAsyncPromise: any = oldApplyAsync.apply(this, args);
					stubPromiseResolver(applyAsyncPromise.stubPromise);
					serverPromiseResolver(applyAsyncPromise.serverPromise);

					applyAsyncPromise.stubPromise
						.catch(() => {}) // silent uncaught promise
						.finally(() => {
							finished = true;
						});

					applyAsyncPromise
						.then((result: any) => {
							resolve(result);
						})
						.catch((err: any) => {
							reject(err);
						});

					serverPromise.catch(() => {}); // silent uncaught promise
				});

				Meteor._setImmediate(() => {
					if (!finished) {
						console.warn(
							`Method stub (${name}) took too long and could cause unexpected problems. Learn more at https://v3-migration-docs.meteor.com/breaking-changes/call-x-callAsync.html#considerations-for-effective-use-of-meteor-callasync`,
						);
					}
				});
			},
			{
				stubPromise,
				serverPromise,
			},
		);
	};

	const oldApply = Connection.prototype.apply;
	Connection.prototype.apply = function (this: any, name: string, args: any[], options: any, callback: Function) {
		if (this._stream._neverQueued) {
			return oldApply.apply(this, arguments as any);
		}

		// Apply runs the stub before synchronously returning.
		//
		// However, we want the server to run the methods in the original call order
		// so we have to queue sending the message to the server until any previous async
		// methods run.
		// This does mean the stubs run in a different order than the methods on the
		// server.

		if (!callback && typeof options === 'function') {
			callback = options;
			options = undefined;
		}

		const { methodInvoker, result } = oldApply.call(
			this,
			name,
			args,
			{
				...options,
				_returnMethodInvoker: true,
			},
			callback,
		);

		if (methodInvoker) {
			queueFunction((resolve: Function) => {
				this._addOutstandingMethod(methodInvoker, options);
				resolve();
			});
		}

		return result;
	};

	/**
	 * Queue subscriptions in case they rely on previous method calls
	 */
	let queueSend = false;
	const oldSubscribe = Connection.prototype.subscribe;
	Connection.prototype.subscribe = function (this: any) {
		if (this._stream._neverQueued) {
			return oldSubscribe.apply(this, arguments as any);
		}

		queueSend = true;
		try {
			return oldSubscribe.apply(this, arguments as any);
		} finally {
			queueSend = false;
		}
	};

	const oldSend = Connection.prototype._send;
	Connection.prototype._send = function (this: any, params: any, shouldQueue: boolean) {
		if (this._stream._neverQueued) {
			return oldSend.apply(this, arguments as any);
		}

		if (!queueSend && !shouldQueue) {
			return oldSend.call(this, params);
		}

		queueSend = false;
		queueFunction((resolve: Function) => {
			try {
				oldSend.call(this, params);
			} finally {
				resolve();
			}
		});
	};

	const _oldSendOutstandingMethodBlocksMessages = Connection.prototype._sendOutstandingMethodBlocksMessages;
	Connection.prototype._sendOutstandingMethodBlocksMessages = function (this: any) {
		if (this._stream._neverQueued) {
			return _oldSendOutstandingMethodBlocksMessages.apply(this, arguments as any);
		}
		queueFunction((resolve: Function) => {
			try {
				_oldSendOutstandingMethodBlocksMessages.apply(this, arguments as any);
			} finally {
				resolve();
			}
		});
	};
};

Meteor.refresh = () => {};

const runtimeConfig = typeof __meteor_runtime_config__ !== 'undefined' ? __meteor_runtime_config__ : Object.create(null);
const ddpUrl = runtimeConfig.DDP_DEFAULT_CONNECTION_URL || '/';
const retry = new Retry();

function onDDPVersionNegotiationFailure(description: string) {
	Meteor._debug(description);

	if (Package.reload) {
		const migrationData = Package.reload.Reload._migrationData('livedata') || Object.create(null);
		let failures = migrationData.DDPVersionNegotiationFailures || 0;

		++failures;
		Package.reload.Reload._onMigrate('livedata', () => [true, { DDPVersionNegotiationFailures: failures }]);

		retry.retryLater(failures, () => {
			Package.reload.Reload._reload({ immediateMigration: true });
		});
	}
}

loadAsyncStubHelpers();
Meteor.connection = DDP.connect(ddpUrl, { onDDPVersionNegotiationFailure });

['subscribe', 'methods', 'isAsyncCall', 'call', 'callAsync', 'apply', 'applyAsync', 'status', 'reconnect', 'disconnect'].forEach((name) => {
	(Meteor as any)[name] = (Meteor.connection as any)[name].bind(Meteor.connection);
});

Package['ddp-client'] = { DDP };
