import { createHash } from 'crypto';

export const MEDSENSE_SESSION_INFO_VERSION = 3;

const SESSION_STATUS_VALUES = new Set(['running', 'waiting_for_user', 'waiting_for_staff', 'voice_active', 'interrupted', 'ended']);

const defaultCurrentOwner = () => ({
	kind: null as 'ai' | 'staff' | 'voice' | null,
	id: null as string | null,
	sinceTs: null as string | null,
	reason: null as string | null,
});

const emptyActiveRun = () => ({
	runId: null as string | null,
	orchestrator: null as string | null,
	phase: null as string | null,
	startedAt: null as string | null,
});

const emptyPending = () => ({
	kind: null as string | null,
	recoverable: false,
	waitingFor: null as 'user' | 'staff' | 'system' | null,
	formId: null as string | null,
	toolCallIds: [] as string[],
	markedAt: null as string | null,
	context: null as Record<string, any> | null,
});

export const createDefaultMedsenseSessionInfo = () => ({
	version: MEDSENSE_SESSION_INFO_VERSION,
	sessionId: null as string | null,
	status: 'ended' as 'running' | 'waiting_for_user' | 'waiting_for_staff' | 'voice_active' | 'interrupted' | 'ended',
	currentOwner: defaultCurrentOwner(),
	activeRun: emptyActiveRun(),
	pending: emptyPending(),
	lastRecovery: null as Record<string, any> | null,
	sessionStartMsgId: null as string | null,
	sessionStartTs: null as string | null,
	lastActivityTs: null as string | null,
	lastAssessedMsgId: null as string | null,
	sessionBuffer: [] as Array<Record<string, any>>,
	sessionForms: [] as Array<Record<string, any>>,
	roomFormSubmissions: [] as Array<Record<string, any>>,
	summary: {
		text: '',
		updatedAt: null as string | null,
		lastProcessedMessageId: null as string | null,
	},
	summaryUpdate: {
		inProgress: false,
		triggerMessageId: null as string | null,
		startedAt: null as string | null,
	},
	voice: {
		active: false,
		sessionId: null as string | null,
		patientUserId: null as string | null,
		patientName: null as string | null,
		patientVisitorToken: null as string | null,
		patientIdentityType: null as string | null,
		voiceIdentityStatus: null as string | null,
		profileFetchForbidden: true,
		pendingIdentity: null as Record<string, any> | null,
		identityConfirmedAt: null as string | null,
		identityConfirmationMethod: null as string | null,
		transport: null as string | null,
		roomName: null as string | null,
		state: 'idle',
		participants: {} as Record<string, any>,
		lastTranscriptAt: null as string | null,
		lastTtsAt: null as string | null,
		lastEventAt: null as string | null,
		lastEventId: null as string | null,
		processedEventIds: [] as string[],
		voicemailRecords: [] as Array<Record<string, any>>,
	},
});

export type MedsenseSessionInfo = ReturnType<typeof createDefaultMedsenseSessionInfo>;

const buildLegacySessionId = (ownerId: string, source: Record<string, any>) =>
	`sess_${createHash('sha1')
		.update(`${ownerId}:${String(source.sessionStartTs || '')}:${String(source.sessionStartMsgId || '')}`)
		.digest('hex')
		.slice(0, 24)}`;

const inferOwnerKind = (ownerId: string | null) => {
	const normalized = String(ownerId || '')
		.trim()
		.toLowerCase();
	if (!normalized) {
		return null;
	}
	if (normalized === 'staff') {
		return 'staff' as const;
	}
	if (normalized === 'voice') {
		return 'voice' as const;
	}
	return 'ai' as const;
};

const normalizeCurrentOwner = (raw: any, fallbackOwnerId: string | null, fallbackSinceTs: string | null) => {
	const fallbackKind = inferOwnerKind(fallbackOwnerId);
	if (!raw || typeof raw !== 'object') {
		return {
			...defaultCurrentOwner(),
			kind: fallbackKind,
			id: fallbackOwnerId,
			sinceTs: fallbackSinceTs,
			reason: fallbackOwnerId ? 'legacy_migration' : null,
		};
	}

	const normalizedKind = inferOwnerKind(typeof raw.kind === 'string' ? raw.kind : typeof raw.id === 'string' ? raw.id : fallbackOwnerId);

	return {
		kind: normalizedKind,
		id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackOwnerId,
		sinceTs: typeof raw.sinceTs === 'string' ? raw.sinceTs : fallbackSinceTs,
		reason: typeof raw.reason === 'string' ? raw.reason : fallbackOwnerId ? 'legacy_migration' : null,
	};
};

const normalizeActiveRun = (raw: any) =>
	raw && typeof raw === 'object'
		? {
				runId: typeof raw.runId === 'string' ? raw.runId : null,
				orchestrator: typeof raw.orchestrator === 'string' ? raw.orchestrator : null,
				phase: typeof raw.phase === 'string' ? raw.phase : null,
				startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
			}
		: emptyActiveRun();

const normalizePending = (raw: any) =>
	raw && typeof raw === 'object'
		? {
				kind: typeof raw.kind === 'string' ? raw.kind : null,
				recoverable: Boolean(raw.recoverable),
				waitingFor: typeof raw.waitingFor === 'string' && ['user', 'staff', 'system'].includes(raw.waitingFor) ? raw.waitingFor : null,
				formId: typeof raw.formId === 'string' ? raw.formId : null,
				toolCallIds: Array.isArray(raw.toolCallIds) ? raw.toolCallIds.filter((value: any) => typeof value === 'string') : [],
				markedAt: typeof raw.markedAt === 'string' ? raw.markedAt : null,
				context: raw.context && typeof raw.context === 'object' && !Array.isArray(raw.context) ? { ...raw.context } : null,
			}
		: emptyPending();

const normalizeLastRecovery = (raw: any) => {
	if (!raw || typeof raw !== 'object') {
		return null;
	}
	return {
		policy: typeof raw.policy === 'string' ? raw.policy : null,
		reason: typeof raw.reason === 'string' ? raw.reason : null,
		recoveredAt: typeof raw.recoveredAt === 'string' ? raw.recoveredAt : null,
		noticeMessageId: typeof raw.noticeMessageId === 'string' ? raw.noticeMessageId : null,
	};
};

const normalizeSessionStatus = (rawStatus: any, currentOwner: Record<string, any>, voiceActive: boolean) => {
	const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : '';
	if (SESSION_STATUS_VALUES.has(normalized)) {
		return normalized;
	}
	if (voiceActive) {
		return 'voice_active';
	}
	if (currentOwner.kind === 'staff') {
		return currentOwner.id ? 'waiting_for_staff' : 'ended';
	}
	if (currentOwner.kind === 'ai') {
		return currentOwner.id ? 'running' : 'ended';
	}
	return 'ended';
};

export const normalizeMedsenseSessionInfo = (raw?: unknown): MedsenseSessionInfo => {
	const base = createDefaultMedsenseSessionInfo();
	const source = raw && typeof raw === 'object' ? (raw as Record<string, any>) : {};
	const legacyAssignedAgent = typeof source.assignedAgent === 'string' && source.assignedAgent.trim() ? source.assignedAgent.trim() : null;
	const normalized = {
		...base,
		...source,
	};

	normalized.version = MEDSENSE_SESSION_INFO_VERSION;
	normalized.sessionId =
		typeof source.sessionId === 'string' && source.sessionId.trim()
			? source.sessionId.trim()
			: legacyAssignedAgent
				? buildLegacySessionId(legacyAssignedAgent, source)
				: null;
	normalized.currentOwner = normalizeCurrentOwner(source.currentOwner, legacyAssignedAgent, source.sessionStartTs || null);
	normalized.activeRun = normalizeActiveRun(source.activeRun);
	normalized.pending = normalizePending(source.pending);
	normalized.lastRecovery = normalizeLastRecovery(source.lastRecovery);
	normalized.status = normalizeSessionStatus(source.status, normalized.currentOwner, Boolean(source.voice?.active));
	normalized.sessionBuffer = Array.isArray(source.sessionBuffer) ? source.sessionBuffer : base.sessionBuffer;
	normalized.sessionForms = Array.isArray(source.sessionForms) ? source.sessionForms : base.sessionForms;
	normalized.roomFormSubmissions = Array.isArray(source.roomFormSubmissions) ? source.roomFormSubmissions : base.roomFormSubmissions;
	normalized.summary =
		source.summary && typeof source.summary === 'object'
			? {
					text: typeof source.summary.text === 'string' ? source.summary.text : '',
					updatedAt: typeof source.summary.updatedAt === 'string' ? source.summary.updatedAt : null,
					lastProcessedMessageId:
						typeof source.summary.lastProcessedMessageId === 'string' && source.summary.lastProcessedMessageId.trim()
							? source.summary.lastProcessedMessageId.trim()
							: null,
				}
			: base.summary;
	normalized.summaryUpdate =
		source.summaryUpdate && typeof source.summaryUpdate === 'object'
			? {
					inProgress: Boolean(source.summaryUpdate.inProgress),
					triggerMessageId:
						typeof source.summaryUpdate.triggerMessageId === 'string' && source.summaryUpdate.triggerMessageId.trim()
							? source.summaryUpdate.triggerMessageId.trim()
							: null,
					startedAt:
						typeof source.summaryUpdate.startedAt === 'string' && source.summaryUpdate.startedAt.trim()
							? source.summaryUpdate.startedAt.trim()
							: null,
				}
			: base.summaryUpdate;
	normalized.voice =
		source.voice && typeof source.voice === 'object'
			? {
					...base.voice,
					...source.voice,
					participants:
						source.voice.participants && typeof source.voice.participants === 'object'
							? source.voice.participants
							: base.voice.participants,
					processedEventIds: Array.isArray(source.voice.processedEventIds)
						? source.voice.processedEventIds
								.map((value: any) => String(value))
								.filter(Boolean)
								.slice(-500)
						: base.voice.processedEventIds,
					voicemailRecords: Array.isArray(source.voice.voicemailRecords)
						? source.voice.voicemailRecords.filter((value: any) => value && typeof value === 'object').slice(-50)
						: base.voice.voicemailRecords,
				}
			: base.voice;

	delete (normalized as any).assignedAgent;
	delete (normalized as any).parentSessionId;
	delete (normalized as any).roomContextSummaries;

	return normalized as MedsenseSessionInfo;
};

export const withDefaultMedsenseSessionInfo = <T extends Record<string, any>>(
	roomExtraData?: T | null,
): T & { medsenseSessionInfo: MedsenseSessionInfo } =>
	({
		...(roomExtraData || {}),
		medsenseSessionInfo: normalizeMedsenseSessionInfo(roomExtraData?.medsenseSessionInfo),
	}) as T & { medsenseSessionInfo: MedsenseSessionInfo };
