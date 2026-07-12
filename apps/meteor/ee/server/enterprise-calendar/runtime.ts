import { createHash, randomBytes } from 'node:crypto';

import { Presence } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import {
	CalendarPresenceProjector,
	CalendarProjectionFactory,
	CalendarProviderRegistry,
	CalendarSecretBox,
	EnterpriseCalendarOrchestrator,
	GraphNotificationProcessor,
	MailboxResolver,
	MicrosoftGraphCalendarProvider,
	validateGraphHandshake,
} from '@rocket.chat/enterprise-calendar';
import type {
	CalendarMailboxIdentity,
	CalendarProjection,
	CalendarConfigurationValidation,
	ICalendarProjectionStore,
	CalendarSyncState,
	ICalendarSyncStateStore,
	GraphChangeNotification,
	GraphProviderConfiguration,
	HttpClient,
	ExplicitMailboxMapping,
	MicrosoftCloud,
	INotificationDeduplicationStore,
} from '@rocket.chat/enterprise-calendar';
import { Logger } from '@rocket.chat/logger';
import { CalendarEvent, Users } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';
import type { Collection } from 'mongodb';

import { metrics } from '../../../app/metrics/server/lib/metrics';
import { settings } from '../../../app/settings/server';
import { db } from '../../../server/database/utils';
import { i18n } from '../../../server/lib/i18n';

const logger = new Logger('EnterpriseCalendar');
const STATE_COLLECTION = 'rocketchat_enterprise_calendar_state';
const NOTIFICATION_COLLECTION = 'rocketchat_enterprise_calendar_notification';
const HEALTH_COLLECTION = 'rocketchat_enterprise_calendar_health';
const CRON_JOB = 'enterprise-calendar-reconciliation';
const TRANSITION_JOB = 'enterprise-calendar-presence-transition';
let settingsWatcherRegistered = false;
export const WEBHOOK_PATH = '/api/v1/enterprise-calendar/graph/notifications';

type PersistedState = CalendarSyncState & {
	_id: string;
	notificationPending?: boolean;
	subscriptionId?: string;
	subscriptionExpiresAt?: Date;
};

const stateCollection = (): Collection<PersistedState> => db.collection<PersistedState>(STATE_COLLECTION);

const encryptedSetting = (id: string, secretBox: CalendarSecretBox): string => {
	const value = settings.get<string>(id);
	if (!value) throw new Error(`${id}-required`);
	return secretBox.decrypt(value, id);
};

export const getSecretBox = (): CalendarSecretBox =>
	CalendarSecretBox.fromBase64Key(process.env.ROCKETCHAT_ENTERPRISE_CALENDAR_ENCRYPTION_KEY);

export const encryptCalendarSetting = (id: string, plaintext: string): string => getSecretBox().encrypt(plaintext, id);

const getGraphConfiguration = (): GraphProviderConfiguration => {
	const secretBox = getSecretBox();
	const credentialType = settings.get<string>('Enterprise_Calendar_Graph_Credential_Type');
	const credential =
		credentialType === 'client-secret'
			? { type: 'client-secret' as const, clientSecret: encryptedSetting('Enterprise_Calendar_Graph_Client_Secret', secretBox) }
			: {
					type: 'certificate' as const,
					certificate: encryptedSetting('Enterprise_Calendar_Graph_Certificate', secretBox),
					privateKey: encryptedSetting('Enterprise_Calendar_Graph_Private_Key', secretBox),
				};
	const webhookEnabled = settings.get<boolean>('Enterprise_Calendar_Graph_Webhook_Enabled');
	return {
		cloud: settings.get<MicrosoftCloud>('Enterprise_Calendar_Graph_Cloud') ?? 'global',
		tenantId: settings.get<string>('Enterprise_Calendar_Graph_Tenant_Id') ?? '',
		clientId: settings.get<string>('Enterprise_Calendar_Graph_Client_Id') ?? '',
		credential,
		...(webhookEnabled && {
			webhookUrl: settings.get<string>('Enterprise_Calendar_Graph_Webhook_Url'),
			webhookClientState: encryptedSetting('Enterprise_Calendar_Graph_Webhook_Client_State', secretBox),
		}),
		requestTimeoutMs: 20_000,
	};
};

const httpClient: HttpClient = async (url, request) =>
	serverFetch(url, {
		method: request.method,
		headers: request.headers,
		body: request.body,
		timeout: request.timeoutMs,
		ignoreSsrfValidation: false,
		allowList: [],
	});

class MongoStateStore implements ICalendarSyncStateStore {
	async get(userId: string): Promise<CalendarSyncState | null> {
		return stateCollection().findOne({ _id: userId });
	}

	async save(state: CalendarSyncState): Promise<void> {
		const entries = Object.entries(state).filter(([, value]) => value !== undefined);
		const definedState = Object.fromEntries(entries) as Partial<PersistedState>;
		const optionalKeys = ['cursor', 'lastAttemptAt', 'lastSuccessAt', 'lastErrorCategory', 'backoffUntil'] as const;
		const unset = Object.fromEntries(optionalKeys.filter((key) => state[key] === undefined).map((key) => [key, '']));
		await stateCollection().updateOne(
			{ _id: state.userId },
			{ $set: definedState, ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}), $setOnInsert: { _id: state.userId } },
			{ upsert: true },
		);
	}
}

class MongoProjectionStore implements ICalendarProjectionStore {
	async upsert(events: CalendarProjection[]): Promise<void> {
		for (const event of events) {
			await CalendarEvent.updateOne(
				{ uid: event.userId, provider: event.provider, externalId: event.eventHash, source: 'enterprise-calendar' } as never,
				{
					$set: {
						uid: event.userId,
						externalId: event.eventHash,
						startTime: event.start,
						endTime: event.end,
						subject: '',
						description: '',
						notificationSent: true,
						// Older Rocket.Chat nodes must never schedule this provider-owned
						// projection through the legacy calendar presence path.
						busy: false,
						calendarPresenceEnabled:
							(!event.isAllDay || settings.get<boolean>('Enterprise_Calendar_Include_All_Day')) &&
							(event.availability === 'busy' ||
								event.availability === 'outOfOffice' ||
								(event.availability === 'tentative' && settings.get<boolean>('Enterprise_Calendar_Include_Tentative')) ||
								(event.availability === 'workingElsewhere' && settings.get<boolean>('Enterprise_Calendar_Include_Working_Elsewhere'))),
						source: 'enterprise-calendar',
						provider: event.provider,
						mailboxHash: event.mailboxHash,
						availability: event.availability,
						isAllDay: event.isAllDay,
						isPrivate: event.isPrivate,
						lastModifiedAt: event.lastModifiedAt,
					} as never,
				},
				{ upsert: true },
			);
		}
	}

	async remove(userId: string, provider: CalendarMailboxIdentity['provider'], eventHashes: string[]): Promise<void> {
		if (!eventHashes.length) return;
		await CalendarEvent.deleteMany({ uid: userId, provider, source: 'enterprise-calendar', externalId: { $in: eventHashes } } as never);
	}

	async replaceWindow(
		userId: string,
		provider: CalendarMailboxIdentity['provider'],
		_windowStart: Date,
		_windowEnd: Date,
		events: CalendarProjection[],
	): Promise<void> {
		await CalendarEvent.deleteMany({
			uid: userId,
			provider,
			source: 'enterprise-calendar',
		} as never);
		await this.upsert(events);
	}

	async findActive(userId: string, at: Date): Promise<CalendarProjection[]> {
		const records = await CalendarEvent.find({
			uid: userId,
			source: 'enterprise-calendar',
			startTime: { $lte: at },
			endTime: { $gt: at },
		} as never).toArray();
		return records.map((event) => ({
			userId,
			provider: (event as never as CalendarProjection).provider,
			mailboxHash: (event as never as CalendarProjection).mailboxHash,
			eventHash: event.externalId ?? event._id,
			start: event.startTime,
			end: event.endTime as Date,
			availability: (event as never as CalendarProjection).availability,
			isAllDay: Boolean((event as never as CalendarProjection).isAllDay),
			isPrivate: Boolean((event as never as CalendarProjection).isPrivate),
		}));
	}

	async removeExpired(before: Date): Promise<number> {
		const result = await CalendarEvent.deleteMany({ source: 'enterprise-calendar', endTime: { $lt: before } } as never);
		return result.deletedCount;
	}
}

const presenceAdapter = {
	async apply(userId: string, status: 'busy' | 'away', expiresAt: Date): Promise<void> {
		const user = await Users.findOneById(userId, { projection: { language: 1 } });
		const lng = user?.language || settings.get<string>('Language') || 'en';
		await Presence.setActiveState(userId, {
			statusDefault: status === 'away' ? UserStatus.AWAY : UserStatus.BUSY,
			statusText: i18n.t('Presence_status_outlook_in_a_meeting', { lng }),
			statusSource: 'external',
			statusExpiresAt: expiresAt,
			statusId: 'enterprise-calendar',
		});
		metrics.enterpriseCalendarPresenceTransitionsTotal.inc({ status });
	},
	async clear(userId: string): Promise<void> {
		await Presence.endActiveState(userId, 'enterprise-calendar');
		metrics.enterpriseCalendarPresenceTransitionsTotal.inc({ status: 'clear' });
	},
};

const parseMappings = (): ExplicitMailboxMapping[] => {
	const raw = settings.get<string>('Enterprise_Calendar_Mailbox_Mappings') || '[]';
	const value: unknown = JSON.parse(raw);
	if (!Array.isArray(value) || value.length > 10_000) throw new Error('invalid-enterprise-calendar-mailbox-mappings');
	const mappings = value.map((entry) => {
		if (!entry || typeof entry !== 'object') throw new Error('invalid-enterprise-calendar-mailbox-mapping');
		const record = entry as Record<string, unknown>;
		const { provider } = record;
		if (typeof record.userId !== 'string' || typeof record.address !== 'string')
			throw new Error('invalid-enterprise-calendar-mailbox-mapping');
		if (provider !== 'microsoft-graph' && provider !== 'exchange-ews') throw new Error('invalid-enterprise-calendar-provider');
		const typedProvider: ExplicitMailboxMapping['provider'] = provider;
		return {
			userId: record.userId,
			address: record.address,
			provider: typedProvider,
			enabled: record.enabled !== false,
			...(typeof record.externalUserId === 'string' && { externalUserId: record.externalUserId }),
			...(typeof record.tenantId === 'string' && { tenantId: record.tenantId }),
		};
	});
	new MailboxResolver(mappings).validateNoDuplicates();
	return mappings;
};

export const createGraphProvider = (): MicrosoftGraphCalendarProvider =>
	new MicrosoftGraphCalendarProvider(getGraphConfiguration(), httpClient);

const getRuntime = () => {
	const encryptionKey = Buffer.from(process.env.ROCKETCHAT_ENTERPRISE_CALENDAR_ENCRYPTION_KEY ?? '', 'base64');
	const registry = new CalendarProviderRegistry();
	const graph = createGraphProvider();
	registry.register(graph);
	const projections = new MongoProjectionStore();
	const mapping = {
		includeAllDay: settings.get<boolean>('Enterprise_Calendar_Include_All_Day'),
		tentative: settings.get<boolean>('Enterprise_Calendar_Include_Tentative') ? ('busy' as const) : ('none' as const),
		workingElsewhere: settings.get<boolean>('Enterprise_Calendar_Include_Working_Elsewhere') ? ('busy' as const) : ('none' as const),
	};
	return {
		graph,
		projections,
		presence: new CalendarPresenceProjector(presenceAdapter, mapping),
		orchestrator: new EnterpriseCalendarOrchestrator(
			registry,
			new MongoStateStore(),
			projections,
			new CalendarProjectionFactory(createHash('sha256').update(encryptionKey).update('projection').digest()),
			new CalendarPresenceProjector(presenceAdapter, mapping),
			{
				pastMs: Math.min(Math.max(settings.get<number>('Enterprise_Calendar_Sync_Past_Hours') || 1, 1), 168) * 60 * 60_000,
				futureMs: Math.min(Math.max(settings.get<number>('Enterprise_Calendar_Sync_Future_Days') || 14, 1), 90) * 24 * 60 * 60_000,
			},
		),
	};
};

const setupNextEnterpriseTransition = async (): Promise<void> => {
	if (await cronJobs.has(TRANSITION_JOB)) await cronJobs.remove(TRANSITION_JOB);
	if (!settings.get<boolean>('Enterprise_Calendar_Enabled')) return;
	const now = new Date();
	const [nextStart, nextEnd] = await Promise.all([
		CalendarEvent.findOne({ source: 'enterprise-calendar', calendarPresenceEnabled: true, startTime: { $gt: now } } as never, {
			sort: { startTime: 1 },
			projection: { startTime: 1 },
		}),
		CalendarEvent.findOne({ source: 'enterprise-calendar', calendarPresenceEnabled: true, endTime: { $gt: now } } as never, {
			sort: { endTime: 1 },
			projection: { endTime: 1 },
		}),
	]);
	const candidates = [nextStart?.startTime, nextEnd?.endTime].filter((value): value is Date => value instanceof Date);
	if (!candidates.length) return;
	const transitionAt = candidates.reduce((earliest, candidate) => (candidate < earliest ? candidate : earliest));
	await cronJobs.addAtTimestamp(TRANSITION_JOB, transitionAt, processEnterpriseTransitions);
};

const processEnterpriseTransitions = async (): Promise<void> => {
	const now = new Date();
	const lowerBound = new Date(now.getTime() - 90_000);
	const events = await CalendarEvent.find(
		{
			source: 'enterprise-calendar',
			calendarPresenceEnabled: true,
			$or: [{ startTime: { $gt: lowerBound, $lte: now } }, { endTime: { $gt: lowerBound, $lte: now } }],
		} as never,
		{ projection: { uid: 1 } },
	).toArray();
	const { presence, projections } = getRuntime();
	for (const userId of new Set(events.map(({ uid }) => uid))) {
		await presence.recompute(userId, await projections.findActive(userId, now), now);
	}
	await setupNextEnterpriseTransition();
};

const renewSubscription = async (
	graph: MicrosoftGraphCalendarProvider,
	userId: string,
	mailbox: CalendarMailboxIdentity,
): Promise<void> => {
	if (!settings.get<boolean>('Enterprise_Calendar_Graph_Webhook_Enabled')) return;
	const state = await stateCollection().findOne({ _id: userId });
	if (state?.subscriptionExpiresAt && state.subscriptionExpiresAt.getTime() - Date.now() > 24 * 60 * 60_000) return;
	const clientState = encryptedSetting('Enterprise_Calendar_Graph_Webhook_Client_State', getSecretBox());
	const subscription = await graph.createOrRenewSubscription(
		mailbox,
		state?.subscriptionId && state.subscriptionExpiresAt
			? {
					id: state.subscriptionId,
					mailbox,
					expiresAt: state.subscriptionExpiresAt,
					clientStateHash: createHash('sha256').update(clientState).digest('hex'),
				}
			: undefined,
	);
	await stateCollection().updateOne(
		{ _id: userId },
		{ $set: { subscriptionId: subscription.id, subscriptionExpiresAt: subscription.expiresAt } },
		{ upsert: true },
	);
};

const hasMailboxChanged = (state: PersistedState | null, mailbox: CalendarMailboxIdentity): boolean =>
	Boolean(
		state &&
			(state.mailbox.provider !== mailbox.provider ||
				state.mailbox.address.toLocaleLowerCase('en-US') !== mailbox.address.toLocaleLowerCase('en-US') ||
				state.mailbox.externalUserId !== mailbox.externalUserId ||
				state.mailbox.tenantId !== mailbox.tenantId),
	);

export const reconcileEnterpriseCalendars = async (): Promise<void> => {
	if (!settings.get<boolean>('Enterprise_Calendar_Enabled')) {
		const mappings = parseMappings().filter(({ enabled }) => enabled);
		let graph: MicrosoftGraphCalendarProvider | undefined;
		try {
			graph = createGraphProvider();
		} catch {
			// Local cleanup must still complete when credentials are unavailable.
		}
		for (const mapping of mappings) {
			const state = await stateCollection().findOne({ _id: mapping.userId });
			if (graph && state?.subscriptionId && state.subscriptionExpiresAt && mapping.provider === 'microsoft-graph') {
				try {
					await graph.removeSubscription({
						id: state.subscriptionId,
						mailbox: { provider: mapping.provider, address: mapping.address, externalUserId: mapping.externalUserId },
						expiresAt: state.subscriptionExpiresAt,
						clientStateHash: '',
					});
				} catch {
					// The remote subscription has a bounded lifetime and will expire.
				}
			}
			await Presence.endActiveState(mapping.userId, 'enterprise-calendar');
		}
		await CalendarEvent.deleteMany({ source: 'enterprise-calendar' } as never);
		await stateCollection().deleteMany({});
		if (await cronJobs.has(TRANSITION_JOB)) await cronJobs.remove(TRANSITION_JOB);
		metrics.enterpriseCalendarConfiguredUsers.set(0);
		return;
	}
	const { graph, orchestrator, projections } = getRuntime();
	const mappings = parseMappings().filter(({ enabled, provider }) => enabled && provider === 'microsoft-graph');
	metrics.enterpriseCalendarConfiguredUsers.set(mappings.length);
	const limit = Math.min(Math.max(settings.get<number>('Enterprise_Calendar_Max_Users_Per_Run') || 100, 1), 1_000);
	const attempts = await stateCollection()
		.find({ _id: { $in: mappings.map(({ userId }) => userId) } }, { projection: { lastAttemptAt: 1, notificationPending: 1 } })
		.toArray();
	const attemptByUserId = new Map(attempts.map(({ _id, lastAttemptAt }) => [_id, lastAttemptAt?.getTime() ?? 0]));
	const pendingUserIds = new Set(attempts.filter(({ notificationPending }) => notificationPending).map(({ _id }) => _id));
	const batch = mappings
		.sort((left, right) => {
			const pendingDifference = Number(pendingUserIds.has(right.userId)) - Number(pendingUserIds.has(left.userId));
			return pendingDifference || (attemptByUserId.get(left.userId) ?? 0) - (attemptByUserId.get(right.userId) ?? 0);
		})
		.slice(0, limit);
	for (const mapping of batch) {
		const mailbox = {
			provider: mapping.provider,
			address: mapping.address,
			...(mapping.externalUserId && { externalUserId: mapping.externalUserId }),
			...(mapping.tenantId && { tenantId: mapping.tenantId }),
		};
		const stopTimer = metrics.enterpriseCalendarSyncDurationSeconds.startTimer({ provider: mapping.provider });
		try {
			const user = await Users.findOneById(mapping.userId, { projection: { active: 1 } });
			if (!user?.active) {
				const state = await stateCollection().findOne({ _id: mapping.userId });
				if (state?.subscriptionId && state.subscriptionExpiresAt) {
					try {
						await graph.removeSubscription({
							id: state.subscriptionId,
							mailbox,
							expiresAt: state.subscriptionExpiresAt,
							clientStateHash: '',
						});
					} catch (error) {
						logger.warn({ msg: 'Calendar subscription cleanup failed', provider: mapping.provider, userId: mapping.userId, err: error });
					}
				}
				await CalendarEvent.deleteMany({ uid: mapping.userId, source: 'enterprise-calendar' } as never);
				await Presence.endActiveState(mapping.userId, 'enterprise-calendar');
				await stateCollection().deleteOne({ _id: mapping.userId });
				metrics.enterpriseCalendarSyncTotal.inc({ provider: mapping.provider, result: 'disabled-user-cleanup' });
				continue;
			}
			const previousState = await stateCollection().findOne({ _id: mapping.userId });
			const mailboxChanged = hasMailboxChanged(previousState, mailbox);
			if (mailboxChanged) {
				if (previousState.subscriptionId && previousState.subscriptionExpiresAt) {
					try {
						await graph.removeSubscription({
							id: previousState.subscriptionId,
							mailbox: previousState.mailbox,
							expiresAt: previousState.subscriptionExpiresAt,
							clientStateHash: '',
						});
					} catch {
						// The old subscription will expire automatically.
					}
				}
				await CalendarEvent.deleteMany({ uid: mapping.userId, source: 'enterprise-calendar' } as never);
				await Presence.endActiveState(mapping.userId, 'enterprise-calendar');
				await stateCollection().updateOne(
					{ _id: mapping.userId },
					{
						$set: { mailbox, fullResyncRequired: true, notificationPending: true, retryCount: 0 },
						$unset: { cursor: '', subscriptionId: '', subscriptionExpiresAt: '', backoffUntil: '', lastErrorCategory: '' },
					},
				);
			}
			const synchronized = await orchestrator.synchronize(mapping.userId, mailbox);
			// Successful server ownership ends only the legacy calendar claim; delegated
			// credentials and historical records remain available for rollback.
			await Presence.endActiveState(mapping.userId, 'calendar');
			if (synchronized) await stateCollection().updateOne({ _id: mapping.userId }, { $unset: { notificationPending: '' } });
			await renewSubscription(graph, mapping.userId, mailbox);
			metrics.enterpriseCalendarSyncTotal.inc({ provider: mapping.provider, result: synchronized ? 'success' : 'deferred' });
		} catch (error) {
			metrics.enterpriseCalendarSyncTotal.inc({ provider: mapping.provider, result: 'failure' });
			logger.error({ msg: 'Calendar mailbox synchronization failed', provider: mapping.provider, userId: mapping.userId, err: error });
		} finally {
			stopTimer();
		}
	}
	await projections.removeExpired(new Date(Date.now() - 24 * 60 * 60_000));
	await setupNextEnterpriseTransition();
};

export const setupEnterpriseCalendar = async (): Promise<void> => {
	await stateCollection().createIndexes([{ key: { subscriptionId: 1 }, sparse: true, unique: true }, { key: { backoffUntil: 1 } }]);
	await db.collection(NOTIFICATION_COLLECTION).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
	await cronJobs.add(CRON_JOB, '*/5 * * * *', reconcileEnterpriseCalendars);
	if (!settingsWatcherRegistered) {
		settingsWatcherRegistered = true;
		let initial = true;
		settings.watchMultiple(
			[
				'Enterprise_Calendar_Enabled',
				'Enterprise_Calendar_Mailbox_Mappings',
				'Enterprise_Calendar_Sync_Past_Hours',
				'Enterprise_Calendar_Sync_Future_Days',
				'Enterprise_Calendar_Include_All_Day',
				'Enterprise_Calendar_Include_Tentative',
				'Enterprise_Calendar_Include_Working_Elsewhere',
			],
			() => {
				if (initial) {
					initial = false;
					return;
				}
				void requestEnterpriseCalendarResync()
					.then(reconcileEnterpriseCalendars)
					.catch((error) => logger.error({ msg: 'Calendar configuration reconciliation failed', err: error }));
			},
		);
	}
	await reconcileEnterpriseCalendars();
};

class MongoNotificationDeduplication implements INotificationDeduplicationStore {
	async claim(key: string, expiresAt: Date): Promise<boolean> {
		try {
			await db.collection(NOTIFICATION_COLLECTION).insertOne({ _id: key, expiresAt });
			return true;
		} catch (error: any) {
			if (error?.code === 11000) return false;
			throw error;
		}
	}
}

export const processGraphNotifications = async (notifications: GraphChangeNotification[]) => {
	const clientState = encryptedSetting('Enterprise_Calendar_Graph_Webhook_Client_State', getSecretBox());
	const processor = new GraphNotificationProcessor(clientState, new MongoNotificationDeduplication(), {
		async enqueueSubscription(subscriptionId) {
			await stateCollection().updateOne({ subscriptionId }, { $set: { notificationPending: true } });
		},
	});
	const result = await processor.process(notifications);
	if (result.accepted) metrics.enterpriseCalendarNotificationsTotal.inc({ result: 'accepted' }, result.accepted);
	if (result.rejected) metrics.enterpriseCalendarNotificationsTotal.inc({ result: 'invalid' }, result.rejected);
	return result;
};

export const getEnterpriseCalendarHealth = async () => {
	const mappings = parseMappings().filter(({ enabled }) => enabled);
	const states = await stateCollection()
		.find({ _id: { $in: mappings.map(({ userId }) => userId) } })
		.project<Pick<PersistedState, 'lastSuccessAt' | 'lastErrorCategory' | 'subscriptionExpiresAt'>>({
			lastSuccessAt: 1,
			lastErrorCategory: 1,
			subscriptionExpiresAt: 1,
		})
		.toArray();
	const successes = states.map(({ lastSuccessAt }) => lastSuccessAt).filter((value): value is Date => value instanceof Date);
	const renewals = states.map(({ subscriptionExpiresAt }) => subscriptionExpiresAt).filter((value): value is Date => value instanceof Date);
	const connectionTest = await db.collection(HEALTH_COLLECTION).findOne({ _id: 'microsoft-graph' });
	return {
		enabled: settings.get<boolean>('Enterprise_Calendar_Enabled') === true,
		provider: 'microsoft-graph',
		configuredUsers: mappings.length,
		failingUsers: states.filter(({ lastErrorCategory }) => Boolean(lastErrorCategory)).length,
		lastSuccessfulSynchronization: successes.length ? new Date(Math.max(...successes.map((value) => value.getTime()))) : null,
		nextSubscriptionRenewal: renewals.length ? new Date(Math.min(...renewals.map((value) => value.getTime()))) : null,
		latestErrorCategory: states.find(({ lastErrorCategory }) => lastErrorCategory)?.lastErrorCategory ?? null,
		lastConnectionTest: connectionTest
			? { at: connectionTest.at, valid: connectionTest.valid, code: connectionTest.code ?? null, message: connectionTest.message ?? null }
			: null,
	};
};

export const recordGraphConnectionTest = async (validation: CalendarConfigurationValidation): Promise<void> => {
	await db.collection(HEALTH_COLLECTION).updateOne(
		{ _id: 'microsoft-graph' },
		{
			$set: {
				at: new Date(),
				valid: validation.valid,
				code: validation.code ?? null,
				message: validation.message ?? null,
			},
		},
		{ upsert: true },
	);
};

export const requestEnterpriseCalendarResync = async (userId?: string): Promise<number> => {
	const configuredUserIds = parseMappings()
		.filter(({ enabled }) => enabled)
		.map((mapping) => mapping.userId);
	const userIds = userId ? configuredUserIds.filter((candidate) => candidate === userId) : configuredUserIds;
	if (userId && !userIds.length) throw new Error('calendar-user-not-mapped');
	if (!userIds.length) return 0;
	for (const mappedUserId of userIds) {
		const mapping = parseMappings().find(({ userId: candidate }) => candidate === mappedUserId);
		if (!mapping) continue;
		await stateCollection().updateOne(
			{ _id: mappedUserId },
			{
				$set: { notificationPending: true, fullResyncRequired: true },
				$setOnInsert: {
					_id: mappedUserId,
					userId: mappedUserId,
					mailbox: { provider: mapping.provider, address: mapping.address, externalUserId: mapping.externalUserId },
					retryCount: 0,
				},
			},
			{ upsert: true },
		);
	}
	return userIds.length;
};

export const invalidateGraphSubscriptions = async (): Promise<void> => {
	await stateCollection().updateMany(
		{ subscriptionId: { $exists: true } },
		{
			$set: { notificationPending: true },
			$unset: { subscriptionId: '', subscriptionExpiresAt: '' },
		},
	);
};

export { validateGraphHandshake };

export const generateWebhookClientState = (): string => randomBytes(32).toString('base64url');
