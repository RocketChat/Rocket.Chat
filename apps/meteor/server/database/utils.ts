import type { OffCallbackHandler } from '@rocket.chat/emitter';
import { Emitter } from '@rocket.chat/emitter';
import { MongoInternals } from 'meteor/mongo';
import type { ClientSession, MongoError } from 'mongodb';

import { SystemLogger } from '../lib/logger/system';

export const { db, client } = MongoInternals.defaultRemoteCollectionDriver().mongo;

/**
 * In MongoDB, errors like UnknownTransactionCommitResult and TransientTransactionError occur primarily in the context of distributed transactions
 * and are often due to temporary network issues, server failures, or timeouts. Here’s what each error means and some common causes:
 *
 * 1. UnknownTransactionCommitResult: The client does not know if the transaction was committed successfully or not.
 *   This error can occur when there’s a network disruption between the client and the MongoDB server during the transaction commit,
 *   or when the primary node (which handles transaction commits) is unavailable, possibly due to a primary election or failover in a replica set.
 *
 * 2. TransientTransactionError: A temporary issue disrupts a transaction before it completes.
 *
 * Since these errors are transient, they may resolve on their own when retried after a short interval.
 */
export const shouldRetryTransaction = (e: unknown): boolean =>
	(e as MongoError)?.errorLabels?.includes('UnknownTransactionCommitResult') ||
	(e as MongoError)?.errorLabels?.includes('TransientTransactionError');

const isExtendedSession = (session: any): session is ExtendedSession => {
	return 'onceSuccesfulCommit' in session;
};
export const onceTransactionCommitedSuccessfully = async <T extends ClientSession>(cb: () => Promise<void> | void, session?: T) => {
	if (!session) {
		await cb();
		return;
	}
	if (session?.inTransaction() && isExtendedSession(session)) {
		const withError = async () => {
			try {
				await cb();
			} catch (error) {
				SystemLogger.error(error);
			}
		};

		session.onceSuccesfulCommit(() => {
			void withError();
		});
	}
};

type ExtendedSession = ClientSession & {
	onceSuccesfulCommit: (cb: (session: ClientSession) => void) => OffCallbackHandler;
};

const getExtendedSession = (session: ClientSession, onceSuccesfulCommit: ExtendedSession['onceSuccesfulCommit']): ExtendedSession => {
	return Object.assign(session, { onceSuccesfulCommit });
};

class UnsuccessfulTransactionError extends Error {
	name = UnsuccessfulTransactionError.name;

	constructor(message?: string) {
		super(message || 'Something went wrong while trying to commit changes. Please try again.');
	}
}

export const wrapInSessionTransaction =
	<T extends Array<unknown>, U>(curriedCallback: (session: ClientSession) => (...args: T) => U) =>
	async (...args: T): Promise<Awaited<U>> => {
		const ee = new Emitter<{ success: ClientSession }>();

		const extendedSession = getExtendedSession(client.startSession(), (cb) => ee.once('success', cb));

		const dispatch = (session: ClientSession) => ee.emit('success', session);
		try {
			extendedSession.startTransaction();
			extendedSession.once('ended', dispatch);

			const result = await curriedCallback(extendedSession).apply(this, args);
			await extendedSession.commitTransaction();
			return result;
		} catch (error) {
			await extendedSession.abortTransaction();
			extendedSession.removeListener('ended', dispatch);
			if (shouldRetryTransaction(error)) {
				throw new UnsuccessfulTransactionError('');
			}
			throw error;
		} finally {
			await extendedSession.endSession();
		}
	};
