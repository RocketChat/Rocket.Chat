import type { IMessage } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';

import { SubscriptionsCachedStore } from '../../cachedStores/SubscriptionsCachedStore';
import { Messages, PublicSettings, Subscriptions } from '../../stores';
import { APIClient } from '../RestApiClient';
import { absoluteUrl } from '../absoluteUrl';
import { baseURI } from '../baseURI';
import { getDdpSdk } from '../sdk/ddpSdk';
import { settings } from '../settings';
import { getSearchIndexBackend } from './getSearchIndexBackend';
import { roomMessageDeletes } from './roomMessageDeletes';
import { applyDeleteMessageBulkToSearchIndex } from './searchIndexDeletes';
import { createSearchIndexSyncTimeStore, isSearchIndexOptedIn, subscribeToSearchIndexOptIn } from './searchIndexOptIn';
import {
	backfillMonthsToMaxAgeMs,
	createSearchIndexRuntime,
	createSyncMessagesFetcher,
	searchIndexTuningFromSettings,
	toSearchIndexRooms,
} from './searchIndexRuntime';
import { createSearchIndexSession } from './searchIndexSession';
import { createSearchIndexWriter } from './searchIndexWriter';
import { subscriptionRemovals } from './subscriptionRemovals';

type SearchIndexSource = {
	on: Emitter['on'];
	getUserId(): string;
	privateKey?: CryptoKey;
	decryptMessage(message: IMessage, options: { quoteDepth: number }): Promise<IMessage>;
};
type SearchIndexLogger = { error(error: unknown): void; warn(message: string): void };

/** Connect local indexing to the authenticated client's stores and lifecycle. */
export const createE2EESearchIntegration = (e2e: SearchIndexSource, logger: SearchIndexLogger) => {
	const getUserId = () => {
		try {
			return e2e.getUserId();
		} catch {
			return undefined;
		}
	};
	const workspace = absoluteUrl('');
	const session = createSearchIndexSession(
		{
			on: (type, handler) => e2e.on(type, handler),
			getUserId,
			getPrivateKey: () => e2e.privateKey,
		},
		{
			getBackend: getSearchIndexBackend,
			isAllowed: () => settings.peek<boolean>('E2E_Enable_Local_Search') === true && isSearchIndexOptedIn(workspace, getUserId()),
			onError: logger.error,
		},
	);
	subscribeToSearchIndexOptIn(workspace, () => session.recheck());
	PublicSettings.use.subscribe((state, prevState) => {
		if (state.records.get('E2E_Enable_Local_Search')?.value !== prevState.records.get('E2E_Enable_Local_Search')?.value) session.recheck();
	});

	const writer = createSearchIndexWriter({
		getBackend: () => session.getActiveBackend(),
		onError: logger.error,
		onWarn: logger.warn,
		isRoomSubscribed: (rid) => Subscriptions.state.find((record) => record.rid === rid) !== undefined,
	});
	roomMessageDeletes.on('deleteMessage', ({ _id }) => {
		void writer.remove([_id]);
	});
	roomMessageDeletes.on('deleteMessageBulk', (event) => {
		void applyDeleteMessageBulkToSearchIndex(event, { writer, findMessage: (id) => Messages.state.get(id) });
	});

	const runtime = createSearchIndexRuntime({
		session,
		syncTime: createSearchIndexSyncTimeStore(workspace, getUserId),
		writer,
		syncMessages: createSyncMessagesFetcher({ baseUrl: baseURI.replace(/\/$/, ''), getCredentials: () => APIClient.getCredentials() }),
		decryptMessage: (message) => e2e.decryptMessage(message, { quoteDepth: 0 }),
		getRooms: () => toSearchIndexRooms(Subscriptions.state.records.values()),
		getSubscribedRids: () => new Set(Array.from(Subscriptions.state.records.values(), (sub) => sub.rid)),
		whenRoomsReady: () =>
			new Promise<void>((resolve) => {
				if (SubscriptionsCachedStore.useReady.getState()) return resolve();
				const unsubscribe = SubscriptionsCachedStore.useReady.subscribe((ready) => {
					if (!ready) return;
					unsubscribe();
					resolve();
				});
			}),
		getMaxAgeMs: () => backfillMonthsToMaxAgeMs(settings.peek<number>('E2E_Local_Search_Backfill_Months')),
		getTuning: () => searchIndexTuningFromSettings((id) => settings.peek(id)),
		onError: logger.error,
	});
	subscriptionRemovals.on('removed', ({ rid }) => {
		void runtime.onRoomRemoved(rid);
	});
	e2e.on('E2E_ROOM_READY', (rid: string) => runtime.onRoomKeyReady(rid));
	const { connection } = getDdpSdk();
	let wentOffline = connection.status !== 'connected';
	connection.on('connection', () => {
		if (connection.status !== 'connected') {
			wentOffline = true;
			return;
		}
		if (!wentOffline) return;
		wentOffline = false;
		runtime.onReconnect();
	});
	return { session, writer, runtime };
};
