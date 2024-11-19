import { MongoInternals } from 'meteor/mongo';
import type { MongoError } from 'mongodb';

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
