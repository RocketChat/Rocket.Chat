import type { IAppServerOrchestrator, IAppsCallHistoryEntry, IAppsCallHistoryPage, IAppsCallHistoryQuery } from '@rocket.chat/apps';
import { CallHistoryBridge } from '@rocket.chat/apps/dist/server/bridges/CallHistoryBridge';
import type { CallHistoryItem, IMediaCall } from '@rocket.chat/core-typings';
import { CallHistory, MediaCalls } from '@rocket.chat/models';
import type { FindOptions } from 'mongodb';

import { settings } from '../../../../server/settings';

/**
 * Returned when the query cannot be answered at all, so callers never see a partial page.
 * A factory rather than a constant, so no caller can mutate a value shared across requests.
 */
const emptyPage = (): IAppsCallHistoryPage => ({ entries: [], total: 0, count: 0, offset: 0 });

const DEFAULT_COUNT = 50;
const MAX_COUNT = 100;

/**
 * The only history variant an app may read. Pinned explicitly on every query rather than
 * left to a default, so a variant added later cannot start reaching apps by accident.
 */
const READABLE_TYPE = 'media-call' as const;

/**
 * The `media_calls` fields the audit detail is built from.
 *
 * An allowlist, deliberately. The excluded fields are not merely unused: `caller`, `callee`
 * and `createdBy` each carry a `contractId`, which is a per-session signing credential, and
 * `expiresAt` / `callerRequestedId` are internals. Projecting here means a credential never
 * even reaches the process memory the converter runs in — the converter's own whitelist is
 * the second of two independent barriers.
 */
const CALL_PROJECTION: FindOptions<IMediaCall>['projection'] = {
	state: 1,
	hangupReason: 1,
	endedBy: 1,
	acceptedAt: 1,
	activatedAt: 1,
	endedAt: 1,
	transferredAt: 1,
	parentCallId: 1,
	features: 1,
};

export class AppCallHistoryBridge extends CallHistoryBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	/**
	 * Whether this workspace keeps the history an app would be reading.
	 *
	 * A workspace can be configured to take its call history from an external PBX instead,
	 * and that mode *replaces* the internal log rather than adding to it — Rocket.Chat's own
	 * surfaces stop showing `media-call` rows entirely. Returning those rows here would hand
	 * an app records the product deliberately hides, so we report an empty history instead.
	 */
	private isInternalHistoryInUse(): boolean {
		return !settings.get('VoIP_TeamCollab_ExternalCallHistory_Enabled');
	}

	/**
	 * `Date`s arrive from the app over msgpack. They survive the trip, but the value
	 * originates in app code, so coerce rather than trust: a string date would otherwise
	 * reach Mongo and silently match nothing.
	 */
	private toDate(value: Date | undefined): Date | undefined {
		if (!value) {
			return undefined;
		}

		const date = value instanceof Date ? value : new Date(value);

		return Number.isNaN(date.getTime()) ? undefined : date;
	}

	/**
	 * Reads the calls behind a set of history rows in one query, and pairs each row with its
	 * own call. One query per page, never one per row.
	 */
	private async buildEntries(items: CallHistoryItem[]): Promise<IAppsCallHistoryEntry[]> {
		const converter = this.orch.getConverters().get('callHistory');

		if (!items.length) {
			return [];
		}

		const callIds = [...new Set(items.map((item) => item.callId))];

		const calls = await MediaCalls.find({ _id: { $in: callIds } }, { projection: CALL_PROJECTION }).toArray();
		const callsById = new Map(calls.map((call) => [call._id, call]));

		return items.map((item) => converter.convertEntry(item, callsById.get(item.callId)));
	}

	protected async getById(historyId: string, appId: string): Promise<IAppsCallHistoryEntry | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the call history item byId: "${historyId}"`);

		if (!this.isInternalHistoryInUse()) {
			return undefined;
		}

		const item = await CallHistory.findOne({ _id: historyId, type: READABLE_TYPE });
		if (!item) {
			return undefined;
		}

		const [entry] = await this.buildEntries([item]);

		return entry;
	}

	protected async getByCallId(callId: string, appId: string): Promise<IAppsCallHistoryEntry[]> {
		this.orch.debugLog(`The App ${appId} is getting the call history items byCallId: "${callId}"`);

		if (!this.isInternalHistoryInUse()) {
			return [];
		}

		const items = await CallHistory.findByCallId(callId).toArray();

		return this.buildEntries(items.filter((item) => item.type === READABLE_TYPE));
	}

	protected async find(query: IAppsCallHistoryQuery, appId: string): Promise<IAppsCallHistoryPage> {
		this.orch.debugLog(`The App ${appId} is searching the call history`);

		if (!this.isInternalHistoryInUse()) {
			this.orch
				.getRocketChatLogger()
				.info(
					`The App ${appId} searched the call history, but this workspace reads its call history from an external service, so there is none to return`,
				);
			return emptyPage();
		}

		const offset = Math.max(0, query.offset ?? 0);
		// Clamp rather than reject: an app asking for too much gets a smaller page and a
		// `total` telling it to keep paging, which is friendlier than an error it cannot fix.
		const count = Math.min(Math.max(1, query.count ?? DEFAULT_COUNT), MAX_COUNT);

		const { cursor, totalCount } = CallHistory.findPaginatedByFilters(
			{
				type: READABLE_TYPE,
				uid: query.uid,
				direction: query.direction,
				inStates: query.states,
				from: this.toDate(query.from),
				to: this.toDate(query.to),
			},
			{ sort: { ts: -1 }, skip: offset, limit: count },
		);

		const [items, total] = await Promise.all([cursor.toArray(), totalCount]);
		const entries = await this.buildEntries(items);

		return { entries, total, count: entries.length, offset };
	}
}
