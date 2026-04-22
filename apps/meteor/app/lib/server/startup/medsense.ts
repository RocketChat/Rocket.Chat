import { api } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import {
	MedsenseRequests,
	Rooms,
	Permissions,
	MedsenseDocumentationTemplates,
	Roles,
	Settings,
	Subscriptions,
	Users,
} from '@rocket.chat/models';
import { createHmac, randomBytes } from 'node:crypto';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

import { callbacks } from '../../../../server/lib/callbacks';
import { triggerHandler } from '../../../integrations/server/lib/triggerHandler';
import { settingsRegistry, settings } from '../../../settings/server';
import { sendMessage } from '../functions/sendMessage';

const LEGACY_VOICE_SETTING_IDS = [
	'Medsense_Voice_Public_Base_Url',
	'Medsense_Voice_Service_Timeout_MS',
	'Medsense_Voice_SignalWire_Space_Url',
	'Medsense_Voice_SignalWire_Project_Id',
	'Medsense_Voice_SignalWire_Api_Token',
	'Medsense_Voice_SignalWire_From_Number',
	'Medsense_Voice_Config_Sync_Version',
	'Medsense_Voice_Config_Sync_At',
	'Medsense_Voice_Config_Sync_Error',
] as const;
const MEDSENSE_TOP_LEVEL_SETTING_IDS = [
	'Medsense_Bot_User',
	'Medsense_Start_Chat_Greeting',
	'Medsense_Start_Chat_Label',
	'Medsense_Start_Chat_Roles',
] as const;
const normalizeBaseUrl = (value?: string): string => {
	let trimmed = String(value || '')
		.trim()
		.replace(/\/+$/, '');
	if (!trimmed) {
		return '';
	}
	if (/\/swml\/inbound$/i.test(trimmed)) {
		trimmed = trimmed.replace(/\/swml\/inbound$/i, '');
	}
	if (/^\/\//.test(trimmed)) {
		trimmed = `https:${trimmed}`;
	}
	if (!/^https?:\/\//i.test(trimmed) && !/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) {
		const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::|\/|$)/i.test(trimmed);
		trimmed = `${isLocalHost ? 'http' : 'https'}://${trimmed}`;
	}
	return trimmed;
};

const getVoiceServiceBaseUrl = (): string =>
	normalizeBaseUrl(settings.get<string>('Medsense_Voice_Service_Url') || process.env.MEDSENSE_VOICE_SERVICE_URL || '');

const getVoiceServiceSecret = (): string =>
	String(settings.get<string>('Medsense_Voice_Service_Secret') || process.env.MEDSENSE_VOICE_SERVICE_SECRET || '').trim();

const getVoiceServiceTimeoutMs = (): number => {
	const raw = String(process.env.MEDSENSE_VOICE_SERVICE_TIMEOUT_MS || '10000').trim();
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1000), 120000) : 10000;
};

const isMedsenseVoiceEnabled = (): boolean => {
	const value = settings.get<boolean>('Medsense_Voice_Enabled');
	if (typeof value === 'boolean') {
		return value;
	}
	const env = String(process.env.MEDSENSE_VOICE_ENABLED || '')
		.trim()
		.toLowerCase();
	return ['1', 'true', 'yes', 'on'].includes(env);
};

const buildVoiceSignatureHeaders = (payload: Record<string, unknown>) => {
	const secret = getVoiceServiceSecret();
	const timestamp = String(Date.now());
	const serialized = serializeVoicePayloadForSignature(payload);
	const signature = secret ? createHmac('sha256', secret).update(`${timestamp}.${serialized}`).digest('hex') : '';

	return {
		'X-Medsense-Voice-Timestamp': timestamp,
		'X-Medsense-Voice-Signature': signature,
		'X-Medsense-Voice-Secret': secret,
	};
};

const canonicalizeVoicePayloadForSignature = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map((entry) => canonicalizeVoicePayloadForSignature(entry));
	}
	if (value && typeof value === 'object') {
		const input = value as Record<string, unknown>;
		const output: Record<string, unknown> = {};
		for (const key of Object.keys(input).sort()) {
			output[key] = canonicalizeVoicePayloadForSignature(input[key]);
		}
		return output;
	}
	return value;
};

const serializeVoicePayloadForSignature = (payload: Record<string, unknown>): string =>
	JSON.stringify(canonicalizeVoicePayloadForSignature(payload || {}));

const hasMedsenseVoiceServiceConfigured = (): boolean => Boolean(getVoiceServiceBaseUrl() && getVoiceServiceSecret());

const postToVoiceService = async (path: string, payload: Record<string, unknown>) => {
	if (!hasMedsenseVoiceServiceConfigured() || !isMedsenseVoiceEnabled()) {
		return null;
	}

	const headers = buildVoiceSignatureHeaders(payload);
	const baseUrl = getVoiceServiceBaseUrl();
	const timeout = getVoiceServiceTimeoutMs();
	return HTTP.post(`${baseUrl}${path}`, {
		headers,
		timeout,
		data: payload,
	});
};

const errorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	if (typeof error === 'string' && error) {
		return error;
	}
	try {
		return JSON.stringify(error);
	} catch {
		return 'unknown error';
	}
};

const removeLegacyVoiceSettings = async (): Promise<void> => {
	for (const settingId of LEGACY_VOICE_SETTING_IDS) {
		try {
			await Settings.removeById(settingId);
		} catch (error) {
			console.error(`[MedsenseVoice] failed to remove legacy setting ${settingId}:`, error);
		}
	}
};

const enforceMedsenseSettingGroup = async (): Promise<void> => {
	try {
		await Settings.updateMany(
			{ _id: { $in: Array.from(MEDSENSE_TOP_LEVEL_SETTING_IDS) } },
			{
				$set: { group: 'Medsense' },
				$unset: { section: 1 },
			},
		);
	} catch (error) {
		console.error('[MedsenseSettings] failed to enforce setting group mapping:', error);
	}
};

export const addMedsenseSettings = async function (): Promise<void> {
	await settingsRegistry.addGroup('Medsense', async function () {
		const roleValues = [
			{ key: 'admin', i18nLabel: 'admin' },
			{ key: 'anonymous', i18nLabel: 'anonymous' },
			{ key: 'app', i18nLabel: 'app' },
			{ key: 'auditor', i18nLabel: 'auditor' },
			{ key: 'auditor-log', i18nLabel: 'auditor-log' },
			{ key: 'bot', i18nLabel: 'bot' },
			{ key: 'guest', i18nLabel: 'guest' },
			{ key: 'livechat-agent', i18nLabel: 'livechat-agent' },
			{ key: 'livechat-manager', i18nLabel: 'livechat-manager' },
			{ key: 'livechat-monitor', i18nLabel: 'livechat-monitor' },
			{ key: 'pharmacy-manager', i18nLabel: 'pharmacy-manager' },
			{ key: 'pharmacy-staff', i18nLabel: 'pharmacy-staff' },
			{ key: 'user', i18nLabel: 'user' },
		];

		// Fetch actual bot users dynamically
		const botUsers = await Users.find({ roles: 'bot' }, { projection: { username: 1 } }).toArray();
		const botUserValues = [
			{ key: '', i18nLabel: 'None' },
			...botUsers.map((u) => ({ key: u.username || '', i18nLabel: u.username || '' })).filter((u) => u.key !== ''),
		];

		// Fallback if no bots found (or just "bot" user isn't tagged with role yet)
		if (!botUserValues.find((v) => v.key === 'bot')) {
			botUserValues.push({ key: 'bot', i18nLabel: 'bot' });
		}

		await this.add('Medsense_Bot_User', 'bot', {
			type: 'select',
			values: botUserValues,
			public: true,
			i18nLabel: 'Medsense_Bot_User',
			i18nDescription: 'Medsense_Bot_User_Description',
		});

		await this.add('Medsense_Start_Chat_Greeting', 'What do you want to discuss today?', {
			type: 'string',
			public: true,
			i18nLabel: 'Medsense_Start_Chat_Greeting',
			i18nDescription: 'Medsense_Start_Chat_Greeting_Description',
		});

		await this.add('Medsense_Start_Chat_Label', 'Start New Chat', {
			type: 'string',
			public: true,
			i18nLabel: 'Medsense_Start_Chat_Label',
			i18nDescription: 'Medsense_Start_Chat_Label_Description',
		});

		await this.add('Medsense_Start_Chat_Roles', ['user'], {
			type: 'multiSelect',
			values: roleValues,
			public: true,
			i18nLabel: 'Medsense_Start_Chat_Roles',
			i18nDescription: 'Medsense_Start_Chat_Roles_Description',
		});

		await this.add(
			'Medsense_Queue_Status_Colors',
			'{"waiting_patient":"warning","ai_preassessment":"secondary","after_hours":"danger","waiting_staff":"warning","ready_for_staff":"featured","taken":"primary","closed":"secondary"}',
			{
				type: 'string',
				public: true,
				multiline: true,
				i18nLabel: 'Medsense_Queue_Status_Colors',
				i18nDescription: 'Medsense_Queue_Status_Colors_Description',
			},
		);

		await this.add(
			'Medsense_Intervention_Types',
			'[{"value":"uti","label":"UTI Assessment"},{"value":"counseling","label":"Counseling"},{"value":"medication_review","label":"Medication Review"},{"value":"refill_request","label":"Refill Request"},{"value":"drug_interaction","label":"Drug Interaction"},{"value":"adverse_event","label":"Adverse Event"},{"value":"other","label":"Other"}]',
			{
				type: 'string',
				public: false,
				multiline: true,
				i18nLabel: 'Medsense_Intervention_Types',
				i18nDescription: 'Medsense_Intervention_Types_Description',
			},
		);

		await this.add('Medsense_Documentation_Prefill_Webhook_Url', '', {
			type: 'string',
			public: false,
			i18nLabel: 'Medsense_Documentation_Prefill_Webhook_Url',
			i18nDescription: 'Medsense_Documentation_Prefill_Webhook_Url_Description',
		});

		await this.add('Medsense_Documentation_Prefill_Webhook_Secret', '', {
			type: 'password',
			public: false,
			i18nLabel: 'Medsense_Documentation_Prefill_Webhook_Secret',
			i18nDescription: 'Medsense_Documentation_Prefill_Webhook_Secret_Description',
		});

		await this.add('Medsense_Documentation_Prefill_Timeout_MS', '15000', {
			type: 'string',
			public: false,
			i18nLabel: 'Medsense_Documentation_Prefill_Timeout_MS',
			i18nDescription: 'Medsense_Documentation_Prefill_Timeout_MS_Description',
		});

		await this.add('Medsense_Voice_Enabled', false, {
			type: 'boolean',
			public: false,
			i18nLabel: 'Medsense_Voice_Enabled',
			i18nDescription: 'Medsense_Voice_Enabled_Description',
		});

		await this.add('Medsense_Voice_Service_Url', '', {
			type: 'string',
			public: false,
			i18nLabel: 'Medsense_Voice_Service_Url',
			i18nDescription: 'Medsense_Voice_Service_Url_Description',
		});

		await this.add('Medsense_Voice_Service_Secret', '', {
			type: 'password',
			public: false,
			i18nLabel: 'Medsense_Voice_Service_Secret',
			i18nDescription: 'Medsense_Voice_Service_Secret_Description',
		});

		await this.add('Medsense_CCDD_NTP_Imported_Version', '', {
			type: 'string',
			public: false,
			hidden: true,
			i18nLabel: 'Medsense_CCDD_NTP_Imported_Version',
			i18nDescription: 'Internal version tracking for imported CCDD NTP data',
		});

		await this.add('Medsense_CCDD_NTP_Last_Imported_At', '', {
			type: 'string',
			public: false,
			hidden: true,
			i18nLabel: 'Medsense_CCDD_NTP_Last_Imported_At',
			i18nDescription: 'Internal timestamp for the last CCDD NTP import',
		});
	});

	// Medsense Pharmacy Roles
	const rolesToCreate = [
		{ _id: 'pharmacy-manager', name: 'Pharmacy Manager', scope: 'Users', description: 'Manager of a Pharmacy' },
		{ _id: 'pharmacy-staff', name: 'Pharmacy Staff', scope: 'Users', description: 'Staff member of a Pharmacy' },
	];

	for (const role of rolesToCreate) {
		const existingRole = await Roles.findOneById(role._id);
		if (!existingRole) {
			await Roles.insertOne({
				_id: role._id,
				name: role.name,
				scope: role.scope,
				description: role.description,
				protected: false,
				mandatory: false,
			});
		}
	}

	// Medsense Pharmacy Permissions
	await Permissions.create('medsense-manage-all-pharmacies', ['admin']);
	await Permissions.create('medsense-manage-individual-pharmacy', ['admin', 'pharmacy-manager']);
	await Permissions.create('medsense-invite-pharmacy-staff', ['admin', 'pharmacy-manager']);
	await Permissions.create('medsense-remove-pharmacy-staff', ['admin', 'pharmacy-manager']);
	await Permissions.create('medsense-change-staff-level', ['admin']);

	// Medsense Queue Permissions (Request-Record)
	await Permissions.create('medsense-view-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
	await Permissions.create('medsense-take-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
	await Permissions.create('medsense-close-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
	await Permissions.create('medsense-view-hub', ['admin']);
	await Permissions.create('medsense-create-interventions', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
	await Permissions.create('medsense-create-chat-internal', ['admin', 'pharmacy-manager', 'pharmacy-staff']);

	// Medsense Documentation Permissions
	await Permissions.create('manage-medsense-documentation-templates', ['admin']);
	await Permissions.create('complete-medsense-documentation', ['admin', 'pharmacy-manager', 'pharmacy-staff']);

	// Remove deprecated permissions
	await Permissions.deleteOne({ _id: 'medsense-manage-pharmacies' });
	await Permissions.deleteOne({ _id: 'medsense-manage-own-pharmacy' });
	await Permissions.deleteOne({ _id: 'medsense-view-pharmacy-members' });
	await Permissions.deleteOne({ _id: 'medsense-create-pharmacy-teams' });
};

// Legacy stubs (Settings removed)
const getStaffRoles = (): string[] => [];
const userHasStaffRole = (_user: any, _staffRoles: any): boolean => false;
const getRoomStaffCount = async (_roomId: string, _staffRoles: string[], _excludeUserId?: string): Promise<number> => 0;

const markRoomTaken = async (room: IRoom, user: IUser): Promise<void> => {
	const requestId = room.medsenseActiveRequestId;
	if (!requestId) return;

	const request = await MedsenseRequests.findOneById(requestId);
	if (!request || !['waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(request.status)) return;

	await MedsenseRequests.markTaken(requestId, user._id, user.username || '');

	await Rooms.update(
		{ _id: room._id },
		{
			$set: {
				medsenseActiveRequestStatus: 'taken',
				medsenseAssigned: 'Staff',
			},
		},
	);

	await sendMessage(
		user,
		{
			rid: room._id,
			msg: `Taken by @${user.username}`,
		},
		room,
	);

	api.broadcast('room.save', {
		_id: room._id,
		medsenseActiveRequestStatus: 'taken',
		medsenseAssigned: 'Staff',
	});
};

const registerMedsensePendingCallbacks = (): void => {
	callbacks.add(
		'afterAddedToRoom',
		async ({ user }, room) => {
			// Check Permission: medsense-take-request
			if (!(await hasPermissionAsync(user._id, 'medsense-take-request'))) {
				return;
			}

			const roomData = await Rooms.findOneById(room._id);
			if (!roomData) return;

			// Check if room has active pending request
			if (
				!['waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(roomData.medsenseActiveRequestStatus ?? '') ||
				!roomData.medsenseActiveRequestId
			) {
				return;
			}

			await markRoomTaken(roomData as IRoom, user);
		},
		callbacks.priority.LOW,
		'medsense-pending-queue-added',
	);

	// Auto-close on leave REMOVED (Manual close only)
};

const MEDSENSE_SESSION_SUMMARY_STALE_MS = 10 * 60 * 1000;
const MEDSENSE_SESSION_INFO_VERSION = 3;

type MedsenseSessionBufferRole = 'patient' | 'staff' | 'ai' | 'bot' | 'system';
type MedsenseEvidenceWeight = 'primary' | 'secondary' | 'workflow_artifact' | 'context';

const toIsoString = (value: unknown, fallback = new Date()): string => {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString();
	}
	if (value) {
		const date = new Date(value as any);
		if (!Number.isNaN(date.getTime())) {
			return date.toISOString();
		}
	}
	return fallback.toISOString();
};

const normalizeMedsenseSummary = (summary: any) => ({
	text: typeof summary?.text === 'string' ? summary.text : '',
	updatedAt: typeof summary?.updatedAt === 'string' ? summary.updatedAt : null,
	lastProcessedMessageId: typeof summary?.lastProcessedMessageId === 'string' ? summary.lastProcessedMessageId : null,
});

const normalizeMedsenseSummaryUpdate = (summaryUpdate: any) => ({
	inProgress: Boolean(summaryUpdate?.inProgress),
	triggerMessageId: typeof summaryUpdate?.triggerMessageId === 'string' ? summaryUpdate.triggerMessageId : null,
	startedAt: typeof summaryUpdate?.startedAt === 'string' ? summaryUpdate.startedAt : null,
});

const normalizeMedsenseMemorySessionInfo = (raw: any) => {
	const source = raw && typeof raw === 'object' ? raw : {};
	return {
		...source,
		version: MEDSENSE_SESSION_INFO_VERSION,
		sessionId: typeof source.sessionId === 'string' && source.sessionId.trim() ? source.sessionId.trim() : null,
		sessionStartTs: typeof source.sessionStartTs === 'string' ? source.sessionStartTs : null,
		lastActivityTs: typeof source.lastActivityTs === 'string' ? source.lastActivityTs : null,
		sessionBuffer: Array.isArray(source.sessionBuffer) ? source.sessionBuffer : [],
		sessionForms: Array.isArray(source.sessionForms) ? source.sessionForms : [],
		roomFormSubmissions: Array.isArray(source.roomFormSubmissions) ? source.roomFormSubmissions : [],
		summary: normalizeMedsenseSummary(source.summary),
		summaryUpdate: normalizeMedsenseSummaryUpdate(source.summaryUpdate),
	};
};

const isMedsenseSummaryUpdateFresh = (summaryUpdate: ReturnType<typeof normalizeMedsenseSummaryUpdate>): boolean => {
	if (!summaryUpdate.inProgress) {
		return false;
	}
	if (!summaryUpdate.startedAt) {
		return true;
	}
	const startedAt = new Date(summaryUpdate.startedAt).getTime();
	if (!Number.isFinite(startedAt)) {
		return false;
	}
	return Date.now() - startedAt < MEDSENSE_SESSION_SUMMARY_STALE_MS;
};

const resolveMedsensePatientUserIdForRoom = async (roomId: string, requestId?: string | null): Promise<string | null> => {
	let patientUserId: string | undefined;
	if (requestId) {
		const activeReq = await MedsenseRequests.findOneById(requestId);
		patientUserId = activeReq?.requestedByUserId;
	}
	if (!patientUserId) {
		const latestReq = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 }, projection: { requestedByUserId: 1 } });
		patientUserId = latestReq?.requestedByUserId;
	}
	if (!patientUserId) {
		const members = await Subscriptions.findByRoomId(roomId).toArray();
		const memberIds = members.map((member) => member.u?._id).filter(Boolean) as string[];
		if (memberIds.length) {
			const candidates = await Users.find({ _id: { $in: memberIds }, roles: { $in: ['user'] } }, { projection: { roles: 1 } }).toArray();
			const exactUser = candidates.find((candidate) => Array.isArray(candidate.roles) && candidate.roles.length === 1 && candidate.roles.includes('user'));
			patientUserId = (exactUser || candidates[0])?._id;
		}
	}
	return patientUserId || null;
};

const resolveMedsenseMessageRole = async (message: IMessage, user?: IUser): Promise<MedsenseSessionBufferRole> => {
	if ((message as any).t) {
		return 'system';
	}

	const botUsername = String(settings.get<string>('Medsense_Bot_User') || 'bot').trim();
	let userRecord = user;
	if (!userRecord && message.u?._id) {
		userRecord = (await Users.findOneById(message.u._id, { projection: { roles: 1, type: 1, username: 1 } })) as IUser | undefined;
	}

	const roles = Array.isArray(userRecord?.roles) ? userRecord.roles : [];
	const isBot = Boolean((message as any).bot) || userRecord?.type === 'bot' || roles.includes('bot');
	if (isBot) {
		return userRecord?.username === botUsername || message.u?.username === botUsername ? 'ai' : 'bot';
	}

	const isStaff = roles.some((role) => role !== 'user' && role !== 'bot' && role !== 'app');
	return isStaff ? 'staff' : 'patient';
};

const isMedsenseStaffUser = (roles: string[]): boolean => roles.some((role) => role !== 'user' && role !== 'bot' && role !== 'app');

const classifyEvidenceWeight = (message: IMessage, user?: IUser): MedsenseEvidenceWeight => {
	const roles = Array.isArray(user?.roles) ? user.roles : [];
	const username = String(user?.username || message.u?.username || '');
	const type = String((message as any).t || '');

	if (roles.includes('bot') || roles.includes('app') || username === 'bot' || Boolean((message as any).bot)) {
		return 'workflow_artifact';
	}
	if (type && ['uj', 'ul', 'ru', 'room_changed_topic'].includes(type)) {
		return 'workflow_artifact';
	}
	if (roles.length === 1 && roles[0] === 'user') {
		return 'primary';
	}
	if (isMedsenseStaffUser(roles)) {
		return 'secondary';
	}
	return 'context';
};

const normalizeEvidenceWeight = (value: any, role?: string): MedsenseEvidenceWeight => {
	if (['primary', 'secondary', 'workflow_artifact', 'context'].includes(value)) {
		return value;
	}
	if (role === 'patient') {
		return 'primary';
	}
	if (role === 'staff') {
		return 'secondary';
	}
	if (role === 'ai' || role === 'bot' || role === 'system') {
		return 'workflow_artifact';
	}
	return 'context';
};

const buildMedsenseSessionBufferEntry = async (message: IMessage, user?: IUser) => {
	const now = new Date();
	const role = await resolveMedsenseMessageRole(message, user);
	return {
		messageId: message._id,
		ts: toIsoString(message.ts, now),
		role,
		evidenceWeight: classifyEvidenceWeight(message, user),
		...(message.u?._id ? { userId: message.u._id } : {}),
		...(message.u?.username ? { username: message.u.username } : {}),
		text: String(message.msg || '').trim(),
	};
};

const buildMedsenseSummaryMessagePayload = (entry: Record<string, any>) => ({
	messageId: String(entry.messageId || ''),
	ts: typeof entry.ts === 'string' ? entry.ts : new Date().toISOString(),
	role: entry.role || 'context',
	evidenceWeight: normalizeEvidenceWeight(entry.evidenceWeight, entry.role),
	text: typeof entry.text === 'string' ? entry.text : '',
});

const resetMedsenseSessionSummaryUpdate = async (roomId: string, triggerMessageId?: string | null): Promise<void> => {
	const selector: Record<string, any> = { _id: roomId };
	if (triggerMessageId) {
		selector['medsenseSessionInfo.summaryUpdate.triggerMessageId'] = triggerMessageId;
	}
	await Rooms.update(selector, {
		$set: {
			'medsenseSessionInfo.summaryUpdate': {
				inProgress: false,
				triggerMessageId: null,
				startedAt: null,
			},
		},
	});
};

const roomHasEnabledMedsenseSummaryWebhook = (room: IRoom, message: IMessage): boolean =>
	triggerHandler
		.getTriggersToExecute(room, message)
		.some((trigger) => trigger.enabled === true && trigger.event === 'medsenseSessionSummary' && triggerHandler.isTriggerEnabled(trigger));

const registerMedsenseSessionSummaryCallbacks = (): void => {
	callbacks.add(
		'afterSaveMessage',
		async (message: IMessage, { room, user }) => {
			const msgText = String(message?.msg || '').trim();
			if (!msgText || (message as any).editedAt) {
				return message;
			}

			const roomData = await Rooms.findOneById(room._id, {
				projection: {
					name: 1,
					fname: 1,
					t: 1,
					uids: 1,
					usernames: 1,
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
				},
			});
			if (!roomData || (!(roomData as any).medsenseActiveRequestId && !(roomData as any).medsenseSessionInfo)) {
				return message;
			}

			const now = new Date();
			const nowIso = now.toISOString();
			const sessionInfo = normalizeMedsenseMemorySessionInfo((roomData as any).medsenseSessionInfo);
			const sessionId = sessionInfo.sessionId || `msess_${randomBytes(12).toString('hex')}`;
			const bufferEntry = await buildMedsenseSessionBufferEntry(message, user);
			const sessionBuffer = sessionInfo.sessionBuffer.some((entry: any) => entry?.messageId === bufferEntry.messageId)
				? sessionInfo.sessionBuffer
				: [...sessionInfo.sessionBuffer, bufferEntry];
			const nextSessionInfo = {
				...sessionInfo,
				version: MEDSENSE_SESSION_INFO_VERSION,
				sessionId,
				sessionStartTs: sessionInfo.sessionStartTs || bufferEntry.ts,
				sessionStartMsgId: sessionInfo.sessionStartMsgId || bufferEntry.messageId,
				lastActivityTs: nowIso,
				sessionBuffer,
				summary: normalizeMedsenseSummary(sessionInfo.summary),
				summaryUpdate: normalizeMedsenseSummaryUpdate(sessionInfo.summaryUpdate),
			};

			const summaryUpdateIsFresh = isMedsenseSummaryUpdateFresh(nextSessionInfo.summaryUpdate);
			const shouldTrigger = (bufferEntry.role !== 'patient' && sessionBuffer.length >= 5) || sessionBuffer.length >= 8;
			const hasSummaryWebhook = shouldTrigger && !summaryUpdateIsFresh && roomHasEnabledMedsenseSummaryWebhook(roomData as IRoom, message);
			const nextSummaryUpdate = hasSummaryWebhook
				? {
						inProgress: true,
						triggerMessageId: message._id,
						startedAt: nowIso,
					}
				: summaryUpdateIsFresh
					? nextSessionInfo.summaryUpdate
					: {
							inProgress: false,
							triggerMessageId: null,
							startedAt: null,
						};

				const setPatch: Record<string, any> = {
					'medsenseSessionInfo.version': MEDSENSE_SESSION_INFO_VERSION,
				'medsenseSessionInfo.sessionId': sessionId,
				'medsenseSessionInfo.sessionStartTs': nextSessionInfo.sessionStartTs,
				'medsenseSessionInfo.sessionStartMsgId': nextSessionInfo.sessionStartMsgId,
				'medsenseSessionInfo.lastActivityTs': nowIso,
				'medsenseSessionInfo.sessionBuffer': sessionBuffer,
				'medsenseSessionInfo.summaryUpdate': nextSummaryUpdate,
			};
			if (!sessionInfo.summary?.text && !sessionInfo.summary?.updatedAt) {
				setPatch['medsenseSessionInfo.summary'] = nextSessionInfo.summary;
			}

			await Rooms.update(
				{ _id: room._id },
				{
					$set: setPatch,
				},
			);

			if (!hasSummaryWebhook) {
				return message;
			}

			const patientUserId = await resolveMedsensePatientUserIdForRoom(room._id, (roomData as any).medsenseActiveRequestId);
			const payload = {
				roomId: room._id,
				requestId: (roomData as any).medsenseActiveRequestId || null,
				patientUserId,
				finalMessageId: message._id,
				reason: 'summary_update',
				previousSummary: nextSessionInfo.summary,
				sessionContext: {
					sessionId,
					sessionStatus: nextSessionInfo.status,
					currentOwner: nextSessionInfo.currentOwner,
					assigned: (roomData as any).medsenseAssigned === 'Staff' ? 'Staff' : 'AI',
				},
				messages: sessionBuffer.map(buildMedsenseSummaryMessagePayload),
				submittedForms: [...nextSessionInfo.sessionForms, ...nextSessionInfo.roomFormSubmissions],
				patientSafetySnapshot: {},
			};

			try {
				await triggerHandler.executeTriggers('medsenseSessionSummary', message, roomData as IRoom, payload);
			} catch (error) {
				console.error('[MedsenseSessionSummary] webhook trigger failed:', error);
				await resetMedsenseSessionSummaryUpdate(room._id, message._id);
			}

			return message;
		},
		callbacks.priority.LOW,
		'medsense-session-summary-memory',
	);
};

const registerMedsenseVoiceCallbacks = (): void => {
	callbacks.add(
		'afterSaveMessage',
		async (message: IMessage, { room, user }) => {
			if (!isMedsenseVoiceEnabled() || !hasMedsenseVoiceServiceConfigured()) {
				return message;
			}

			const msgText = String(message?.msg || '').trim();
			if (!msgText) {
				return message;
			}
			// Transcript/system backfill messages are bot-authored in voice ingest;
			// do not feed them back into voice TTS playback.
			if (msgText.startsWith('[Patient voice]') || msgText.startsWith('[Voice]')) {
				return message;
			}

			const botUsername = String(settings.get<string>('Medsense_Bot_User') || 'bot').trim();
			if (!botUsername || user?.username !== botUsername) {
				return message;
			}

			const roomData = await Rooms.findOneById(room._id, {
				projection: {
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
				},
			});
			const voice = (roomData as any)?.medsenseSessionInfo?.voice;
			if (!voice?.active || !voice?.sessionId) {
				return message;
			}

			try {
				await postToVoiceService('/v1/voice/events/bot-message', {
					roomId: room._id,
					requestId: (roomData as any)?.medsenseActiveRequestId || null,
					sessionId: voice.sessionId,
					roomName: voice.roomName || null,
					messageId: message._id,
					text: msgText,
					ts: message.ts ? new Date(message.ts as any).toISOString() : new Date().toISOString(),
					botUsername: user.username,
				});
			} catch (error) {
				console.error('[MedsenseVoice] bot message push failed:', error);
			}

			return message;
		},
		callbacks.priority.LOW,
		'medsense-voice-bot-tts',
	);
};

const seedMedsenseDocumentationTemplates = async () => {
	const existingUTI = await MedsenseDocumentationTemplates.findOne({ key: 'uti_v1' });
	if (!existingUTI) {
		await MedsenseDocumentationTemplates.insertOne({
			key: 'uti_v1',
			label: 'UTI Pharmacist Assessment',
			description: 'Standard documentation for uncomplicated Urinary Tract Infections.',
			status: 'active',
			version: 1,
			interventionTypes: ['uti'],
			specialtyActionIds: ['medessist:uti'],
			pdfConfig: {
				documentTitle: 'Pharmacist Assessment Record - UTI',
				showTemplateVersion: true,
			},
			signatureRules: {
				requirePharmacistSignature: true,
				allowPatientSignature: false,
				requirePatientSignature: false,
			},
			sections: [
				{
					key: 'patient_info',
					title: 'Patient Information',
					type: 'patient_info',
					sortOrder: 0,
					visibleInPdf: true,
					fields: [
						{
							key: 'patient_name',
							label: 'Patient Name',
							type: 'text',
							required: true,
							sourceKey: 'patient.name',
							visibleInPdf: true,
							sortOrder: 0,
						},
						{
							key: 'patient_username',
							label: 'Patient Username',
							type: 'text',
							required: false,
							sourceKey: 'patient.username',
							visibleInPdf: true,
							sortOrder: 1,
						},
						{
							key: 'patient_email',
							label: 'Patient Email',
							type: 'text',
							required: false,
							sourceKey: 'patient.email',
							visibleInPdf: true,
							sortOrder: 2,
						},
						{ key: 'dob', label: 'Date of Birth', type: 'date', required: false, visibleInPdf: true, sortOrder: 3 },
					],
				},
				{
					key: 'questionnaire',
					title: 'Questionnaire',
					type: 'questionnaire',
					sortOrder: 1,
					visibleInPdf: true,
					fields: [
						{
							key: 'presenting_concern',
							label: 'Presenting Concern',
							type: 'textarea',
							required: true,
							sourceKey: 'request.reason',
							visibleInPdf: true,
							sortOrder: 0,
						},
						{
							key: 'symptoms',
							label: 'Symptoms',
							type: 'textarea',
							required: true,
							sourceKey: 'request.contextSummary',
							visibleInPdf: true,
							sortOrder: 1,
						},
					],
				},
				{
					key: 'assessment',
					title: 'Clinical Assessment',
					type: 'assessment',
					sortOrder: 2,
					visibleInPdf: true,
					fields: [
						{
							key: 'ai_summary',
							label: 'AI Summary',
							type: 'textarea',
							required: false,
							sourceKey: 'request.aiSummary',
							visibleInPdf: true,
							sortOrder: 0,
						},
						{ key: 'red_flags', label: 'Red Flags Present?', type: 'boolean', required: true, visibleInPdf: true, sortOrder: 1 },
						{ key: 'red_flags_details', label: 'Red Flags Details', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 2 },
						{
							key: 'clinical_assessment',
							label: 'Clinical Assessment',
							type: 'textarea',
							required: true,
							visibleInPdf: true,
							sortOrder: 3,
						},
					],
				},
				{
					key: 'action_plan',
					title: 'Action & Plan',
					type: 'action_taken',
					sortOrder: 3,
					visibleInPdf: true,
					fields: [
						{
							key: 'action_taken',
							label: 'Action Taken',
							type: 'select',
							options: ['Prescribed', 'Referred to MD', 'OTC Recommendation', 'Education Only'],
							required: true,
							visibleInPdf: true,
							sortOrder: 0,
						},
						{ key: 'rationale', label: 'Rationale', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 1 },
					],
				},
				{
					key: 'provider_communication',
					title: 'Provider Communication',
					type: 'provider_communication',
					sortOrder: 4,
					visibleInPdf: true,
					fields: [
						{ key: 'provider_contacted', label: 'Provider Contacted?', type: 'boolean', required: false, visibleInPdf: true, sortOrder: 0 },
						{
							key: 'provider_contact_notes',
							label: 'Provider Communication Notes',
							type: 'textarea',
							required: false,
							visibleInPdf: true,
							sortOrder: 1,
						},
					],
				},
				{
					key: 'prescriptions',
					title: 'Prescription',
					type: 'prescriptions',
					sortOrder: 5,
					visibleInPdf: true,
					fields: [
						{
							key: 'drug_name',
							label: 'Drug',
							type: 'drug',
							required: true,
							visibleInPdf: true,
							sortOrder: 0,
							drugCatalogCodes: [],
							options: [],
						},
						{ key: 'strength', label: 'Strength', type: 'text', required: false, visibleInPdf: true, sortOrder: 1 },
						{ key: 'directions', label: 'Directions', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 2 },
						{ key: 'quantity', label: 'Quantity', type: 'text', required: false, visibleInPdf: true, sortOrder: 3 },
					],
				},
				{
					key: 'counselling',
					title: 'Counselling',
					type: 'counselling',
					sortOrder: 6,
					visibleInPdf: true,
					fields: [
						{ key: 'counselling_points', label: 'Counselling Points', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 0 },
					],
				},
				{
					key: 'follow_up',
					title: 'Follow-up',
					type: 'follow_up',
					sortOrder: 7,
					visibleInPdf: true,
					fields: [
						{ key: 'follow_up_plan', label: 'Follow-up Plan', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 0 },
						{ key: 'follow_up_outcome', label: 'Follow-up Outcome', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 1 },
					],
				},
			],
			createdAt: new Date(),
			_updatedAt: new Date(),
		});
		console.log('[Medsense] Seeded UTI Documentation Template (uti_v1)');
	}

	if (
		existingUTI &&
		(!Array.isArray((existingUTI as any).interventionTypes) ||
			!(existingUTI as any).interventionTypes.length ||
			((existingUTI as any).interventionTypes.length === 1 && (existingUTI as any).interventionTypes[0] === 'other'))
	) {
		await MedsenseDocumentationTemplates.updateOne(
			{ _id: existingUTI._id },
			{
				$set: {
					interventionTypes: ['uti'],
					_updatedAt: new Date(),
				},
			},
		);
	}

	const existingMedsCheck = await MedsenseDocumentationTemplates.findOne({ key: 'medscheck_v1' });
	if (!existingMedsCheck) {
		await MedsenseDocumentationTemplates.insertOne({
			key: 'medscheck_v1',
			label: 'Medication Review',
			description:
				'Ontario MedsCheck documentation aligned to the Pharmacists Worksheet, Personal Medication Record, Patient Take-Home Summary, and Healthcare Provider Notification forms.',
			status: 'active',
			version: 1,
			interventionTypes: ['medication_review'],
			specialtyActionIds: ['medsense-medication-review-app:medication_review_assessment'],
			pdfConfig: {
				documentTitle: 'Medication Review Documentation Record',
				showTemplateVersion: true,
				footerText: 'Structured to mirror Ontario professional pharmacy service MedsCheck forms.',
			},
			signatureRules: {
				requirePharmacistSignature: true,
				allowPatientSignature: true,
				requirePatientSignature: false,
			},
			sections: [
				{
					key: 'patient_info',
					title: 'Patient Information',
					type: 'patient_info',
					sortOrder: 0,
					visibleInPdf: true,
					fields: [
						{
							key: 'patient_name',
							label: 'Patient Name',
							type: 'text',
							required: true,
							sourceKey: 'patient.name',
							visibleInPdf: true,
							sortOrder: 0,
						},
						{ key: 'dob', label: 'Date of Birth', type: 'date', required: false, visibleInPdf: true, sortOrder: 1 },
						{
							key: 'patient_phone',
							label: 'Telephone Number',
							type: 'text',
							required: false,
							sourceKey: 'patient.phoneNumber',
							visibleInPdf: true,
							sortOrder: 2,
						},
						{
							key: 'patient_email',
							label: 'Email Address',
							type: 'text',
							required: false,
							sourceKey: 'patient.email',
							visibleInPdf: true,
							sortOrder: 3,
						},
						{ key: 'patient_address', label: 'Patient Address', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 4 },
						{ key: 'health_card_number', label: 'Health Card Number', type: 'text', required: false, visibleInPdf: true, sortOrder: 5 },
					],
				},
				{
					key: 'service_details',
					title: 'Service Details',
					type: 'questionnaire',
					sortOrder: 1,
					visibleInPdf: true,
					fields: [
						{
							key: 'medscheck_service_type',
							label: 'MedsCheck Service Provided',
							type: 'select',
							required: true,
							sourceKey: 'request.answers.medscheck_service_type',
							visibleInPdf: true,
							sortOrder: 0,
							options: [
								'MedsCheck Annual',
								'MedsCheck Follow-up Hospital Discharge',
								'MedsCheck Follow-up Pharmacist Documented Decision',
								'MedsCheck Follow-up Physician / Nurse Practitioner Referral',
								'MedsCheck Follow-up Hospital Planned Admission',
								'MedsCheck Diabetes Annual',
								'MedsCheck at Home Annual',
								'MedsCheck LTC Annual',
								'MedsCheck LTC Quarterly',
							],
						},
						{
							key: 'interview_location',
							label: 'Interview Conducted At',
							type: 'select',
							required: false,
							visibleInPdf: true,
							sortOrder: 1,
							options: ['Pharmacy', "Patient's Home"],
						},
						{
							key: 'annual_acknowledgement_date',
							label: 'Date Patient Signed Annual Acknowledgement',
							type: 'date',
							required: false,
							visibleInPdf: true,
							sortOrder: 2,
						},
						{
							key: 'caregiver_or_agent',
							label: 'Caregiver / Patient Agent',
							type: 'text',
							required: false,
							visibleInPdf: true,
							sortOrder: 3,
						},
						{
							key: 'primary_care_provider',
							label: 'Primary Care Provider',
							type: 'text',
							required: false,
							visibleInPdf: true,
							sortOrder: 4,
						},
						{ key: 'provider_designation', label: 'Provider Designation', type: 'text', required: false, visibleInPdf: true, sortOrder: 5 },
						{ key: 'provider_fax', label: 'Provider Fax Number', type: 'text', required: false, visibleInPdf: true, sortOrder: 6 },
					],
				},
				{
					key: 'assessment',
					title: 'Assessment',
					type: 'assessment',
					sortOrder: 2,
					visibleInPdf: true,
					fields: [
						{
							key: 'allergies_and_intolerances',
							label: 'Known Allergies and Intolerances',
							type: 'textarea',
							required: false,
							sourceKey: 'request.answers.allergies_and_intolerances',
							visibleInPdf: true,
							sortOrder: 0,
						},
						{
							key: 'no_known_allergies',
							label: 'No Known Allergies or Intolerances',
							type: 'boolean',
							required: false,
							sourceKey: 'request.answers.no_known_allergies',
							visibleInPdf: true,
							sortOrder: 1,
						},
						{
							key: 'lifestyle_information',
							label: 'Lifestyle Information',
							type: 'textarea',
							required: false,
							sourceKey: 'request.answers.lifestyle_information',
							visibleInPdf: true,
							sortOrder: 2,
						},
						{
							key: 'clinical_need_for_service',
							label: 'Clinical Need for Service',
							type: 'textarea',
							required: false,
							visibleInPdf: true,
							sortOrder: 3,
						},
						{ key: 'sources_consulted', label: 'Sources Consulted', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 4 },
					],
				},
				{
					key: 'medication_list',
					title: 'Current Medication List',
					type: 'assessment',
					sortOrder: 3,
					visibleInPdf: true,
					fields: [
						{
							key: 'medication_rows',
							label: 'Current Medication List',
							pdfTitle: 'Current Medication List',
							type: 'repeater',
							required: true,
							sourceKey: 'request.answers.medication_rows',
							visibleInPdf: true,
							sortOrder: 0,
							fields: [
								{ key: 'product_name', label: 'Drug / Product', type: 'text', required: true, visibleInPdf: true, sortOrder: 0 },
								{ key: 'strength', label: 'Strength', type: 'text', required: false, visibleInPdf: true, sortOrder: 1 },
								{ key: 'dosage_form', label: 'Dosage Form', type: 'text', required: false, visibleInPdf: true, sortOrder: 2 },
								{ key: 'directions', label: 'Directions for Use', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 3 },
								{ key: 'indication', label: 'Indication', type: 'text', required: false, visibleInPdf: true, sortOrder: 4 },
								{ key: 'adherence_issue', label: 'Adherence Issue', type: 'text', required: false, visibleInPdf: true, sortOrder: 5 },
								{ key: 'product_type', label: 'Rx / OTC / NHP', type: 'text', required: false, visibleInPdf: true, sortOrder: 6 },
								{ key: 'patient_comments', label: 'Patient Comments', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 7 },
								{ key: 'pharmacist_notes', label: 'Pharmacist Notes', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 8 },
							],
						},
					],
				},
				{
					key: 'therapeutic_issues',
					title: 'Therapeutic Issues and Recommendations',
					type: 'action_taken',
					sortOrder: 4,
					visibleInPdf: true,
					fields: [
						{
							key: 'therapeutic_issue_rows',
							label: 'Therapeutic Issues',
							pdfTitle: 'Therapeutic Issues',
							type: 'repeater',
							required: false,
							sourceKey: 'request.answers.therapeutic_issue_rows',
							visibleInPdf: true,
							sortOrder: 0,
							fields: [
								{ key: 'issue', label: 'Issue', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 0 },
								{
									key: 'recommendation',
									label: 'Recommendation / Action',
									type: 'textarea',
									required: false,
									visibleInPdf: true,
									sortOrder: 1,
								},
								{ key: 'follow_up_needed', label: 'Follow-up Needed', type: 'boolean', required: false, visibleInPdf: true, sortOrder: 2 },
								{
									key: 'provider_notified',
									label: 'Provider Notified',
									type: 'boolean',
									required: false,
									visibleInPdf: true,
									sortOrder: 3,
								},
							],
						},
					],
				},
				{
					key: 'patient_summary',
					title: 'Patient Take-Home Summary',
					type: 'counselling',
					sortOrder: 5,
					visibleInPdf: true,
					fields: [
						{
							key: 'discussion_topic_rows',
							label: "Summary of Today's Discussion",
							pdfTitle: "Summary of Today's Discussion",
							type: 'repeater',
							required: false,
							sourceKey: 'request.answers.discussion_topic_rows',
							visibleInPdf: true,
							sortOrder: 0,
							fields: [{ key: 'topic', label: 'Topic', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 0 }],
						},
						{
							key: 'goal_rows',
							label: 'My Goals',
							pdfTitle: 'My Goals',
							type: 'repeater',
							required: false,
							sourceKey: 'request.answers.goal_rows',
							visibleInPdf: true,
							sortOrder: 1,
							fields: [
								{ key: 'goal', label: 'Goal', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 0 },
								{
									key: 'next_steps',
									label: 'What I Will Do To Get There',
									type: 'textarea',
									required: false,
									visibleInPdf: true,
									sortOrder: 1,
								},
							],
						},
						{
							key: 'resource_rows',
							label: 'Resources and Contacts',
							pdfTitle: 'Resources and Contacts',
							type: 'repeater',
							required: false,
							sourceKey: 'request.answers.resource_rows',
							visibleInPdf: true,
							sortOrder: 2,
							fields: [
								{ key: 'resource', label: 'Resource / Contact', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 0 },
							],
						},
						{
							key: 'referral_rows',
							label: 'Referrals Information',
							pdfTitle: 'Referrals Information',
							type: 'repeater',
							required: false,
							sourceKey: 'request.answers.referral_rows',
							visibleInPdf: true,
							sortOrder: 3,
							fields: [{ key: 'referral', label: 'Referral', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 0 }],
						},
					],
				},
				{
					key: 'provider_communication',
					title: 'Provider Communication',
					type: 'provider_communication',
					sortOrder: 6,
					visibleInPdf: true,
					fields: [
						{
							key: 'provider_notification_summary',
							label: 'Provider Notification Summary',
							type: 'textarea',
							required: false,
							visibleInPdf: true,
							sortOrder: 0,
						},
						{
							key: 'provider_notification_issues',
							label: 'Issues Sent to Provider',
							type: 'textarea',
							required: false,
							visibleInPdf: true,
							sortOrder: 1,
						},
					],
				},
				{
					key: 'follow_up',
					title: 'Follow-up',
					type: 'follow_up',
					sortOrder: 7,
					visibleInPdf: true,
					fields: [
						{ key: 'follow_up_plan', label: 'Follow-up Plan', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 0 },
						{ key: 'follow_up_outcome', label: 'Follow-up Outcome', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 1 },
					],
				},
			],
			createdAt: new Date(),
			_updatedAt: new Date(),
		});
		console.log('[Medsense] Seeded MedsCheck Documentation Template (medscheck_v1)');
		return;
	}

	if (
		!Array.isArray((existingMedsCheck as any).interventionTypes) ||
		!(existingMedsCheck as any).interventionTypes.length ||
		((existingMedsCheck as any).interventionTypes.length === 1 && (existingMedsCheck as any).interventionTypes[0] === 'other')
	) {
		await MedsenseDocumentationTemplates.updateOne(
			{ _id: existingMedsCheck._id },
			{
				$set: {
					interventionTypes: ['medication_review'],
					_updatedAt: new Date(),
				},
			},
		);
	}

	await MedsenseDocumentationTemplates.updateOne(
		{ _id: existingMedsCheck._id },
		{
			$set: {
				label: 'Medication Review',
				specialtyActionIds: ['medsense-medication-review-app:medication_review_assessment'],
				'pdfConfig.documentTitle': 'Medication Review Documentation Record',
				'sections.1.fields.0.sourceKey': 'request.answers.medscheck_service_type',
				'sections.2.fields.0.sourceKey': 'request.answers.allergies_and_intolerances',
				'sections.2.fields.1.sourceKey': 'request.answers.no_known_allergies',
				'sections.2.fields.2.sourceKey': 'request.answers.lifestyle_information',
				'sections.3.fields.0.sourceKey': 'request.answers.medication_rows',
				'sections.4.fields.0.sourceKey': 'request.answers.therapeutic_issue_rows',
				'sections.5.fields.0.sourceKey': 'request.answers.discussion_topic_rows',
				'sections.5.fields.1.sourceKey': 'request.answers.goal_rows',
				'sections.5.fields.2.sourceKey': 'request.answers.resource_rows',
				'sections.5.fields.3.sourceKey': 'request.answers.referral_rows',
				_updatedAt: new Date(),
			},
		},
	);
};

Meteor.startup(async () => {
	await addMedsenseSettings();
	await enforceMedsenseSettingGroup();
	await removeLegacyVoiceSettings();
	await seedMedsenseDocumentationTemplates();
	registerMedsensePendingCallbacks();
	registerMedsenseSessionSummaryCallbacks();
	registerMedsenseVoiceCallbacks();
});
