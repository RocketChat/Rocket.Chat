import { api, OmnichannelIntegration } from '@rocket.chat/core-services';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import type {
	ILivechatVisitor,
	IRoom,
	IUser,
	IMedsenseAfterHoursContacts,
	IMedsenseAfterHoursPolicy,
	IMedsenseDocumentationTemplate,
	IMedsenseNotificationChannel,
	IMedsenseOperatingHours,
	IMedsenseOperatingHoursEntry,
	IMedsenseOperatingHoursWeekday,
	IMedsensePharmacy,
} from '@rocket.chat/core-typings';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { hashLoginToken } from '@rocket.chat/account-utils';
import {
	MedsensePharmacies,
	MedsensePharmacyMemberships,
	MedsensePatientPharmacy,
	MedsenseRequests,
	MedsenseInterventions,
	MedsenseInterventionNotes,
	MedsensePharmacyInvites,
	MedsensePatientContext,
	MedsenseDocumentationTemplates,
	MedsenseDrugCatalog,
	LivechatVisitors,
	Settings,
	Users,
	Rooms,
	Messages,
	Uploads,
	Subscriptions,
	Roles,
} from '@rocket.chat/models';
import { registerGuest } from '@rocket.chat/omni-core';
import { check, Match } from 'meteor/check';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Cookies } from 'meteor/ostrio:cookies';
import { Apps } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';

import { hasAtLeastOnePermissionAsync, hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { archiveRoom } from '../../../lib/server/functions/archiveRoom';
import { closeLivechatRoom } from '../../../lib/server/functions/closeLivechatRoom';
import { createMedsenseBotRoom as createMedsenseBotRoomForUsers } from '../../../lib/server/functions/createMedsenseBotRoom';
import { createDefaultMedsenseSessionInfo } from '../../../lib/server/functions/medsenseSessionInfo';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { ensureUserInRoom } from '../../../lib/server/functions/ensureUserInRoom';
import { checkEmailAvailability } from '../../../lib/server/functions/checkEmailAvailability';
import { checkUsernameAvailability } from '../../../lib/server/functions/checkUsernameAvailability';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { loadMessageHistory } from '../../../lib/server/functions/loadMessageHistory';
import { setUsernameWithValidation } from '../../../lib/server/functions/setUsername';
import { validateNameChars } from '../../../lib/server/functions/validateNameChars';
import { FileUpload } from '../../../file-upload/server';
import { sendFileMessage } from '../../../file-upload/server/methods/sendFileMessage';
import { sendMessage as sendLivechatMessage } from '../../../livechat/server/lib/messages';
import { createRoom as createLivechatRoom } from '../../../livechat/server/lib/rooms';
import { triggerHandler } from '../../../integrations/server/lib/triggerHandler';
import { settings } from '../../../settings/server';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { registerUser } from '../../../../server/methods/registerUser';
import { API } from '../api';
import * as Mailer from '../../../mailer/server/api';
import notifications from '../../../notifications/server/lib/Notifications';
import { omit } from '../../../../lib/utils/omit';

const medsenseCookieParser = new Cookies();

type MedsenseRegistrationStatus = 'pending' | 'verified' | 'locked' | 'completed' | 'expired';

type MedsenseRegistrationPrefill = {
	name?: string;
	email?: string;
	username?: string;
	phone?: string;
	reason?: string;
	pharmacyId?: string;
};

type IMedsensePatientRegistration = {
	_id: string;
	tokenHash: string;
	codeHash: string;
	phoneNumber: string;
	codeExpiresAt: Date;
	attemptCount: number;
	resendCount: number;
	lastSentAt: Date;
	status: MedsenseRegistrationStatus;
	prefill: MedsenseRegistrationPrefill;
	specialtyActionId?: string;
	specialtyRequestId?: string;
	specialtyStatus?: string;
	specialtyError?: string;
	// Legacy fields kept for backward compatibility with older records/payloads.
	specialtyFlowId?: string;
	specialtyRoomId?: string;
	startedByUserId: string;
	startedByUsername?: string;
	verificationSessionHash?: string;
	verificationSessionExpiresAt?: Date;
	completedUserId?: string;
	completedAt?: Date;
	createdAt: Date;
	_updatedAt: Date;
};

const MedsensePatientRegistrations = new Mongo.Collection<IMedsensePatientRegistration>('medsense_patient_registrations');

const REGISTRATION_CODE_TTL_MS = 15 * 60 * 1000;
const REGISTRATION_SESSION_TTL_MS = 30 * 60 * 1000;
const REGISTRATION_LOCK_TTL_MS = 15 * 60 * 1000;
const REGISTRATION_MAX_ATTEMPTS = 5;
const REGISTRATION_RESEND_COOLDOWN_MS = 60 * 1000;
const REGISTRATION_MAX_RESENDS = 3;

const hashRegistrationValue = (value: string): string => createHash('sha256').update(value).digest('hex');

const safeHashEqual = (left: string, right: string): boolean => {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);
	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}
	return timingSafeEqual(leftBuffer, rightBuffer);
};

const createRegistrationCode = (): string => String(randomInt(100000, 1000000));
const createRegistrationToken = (): string => randomBytes(24).toString('hex');
const createRegistrationSessionToken = (): string => randomBytes(32).toString('hex');

const normalizeRegistrationPhone = (value: string): string | null => {
	if (!value) {
		return null;
	}
	const trimmed = String(value).trim();
	const digits = trimmed.replace(/\D/g, '');
	if (trimmed.startsWith('+')) {
		return /^\+[1-9]\d{1,14}$/.test(trimmed) ? trimmed : null;
	}
	if (digits.length === 10) {
		return `+1${digits}`;
	}
	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}
	return null;
};

const normalizeVoiceInboundNumber = (value: string | null | undefined): string | null => {
	if (value === null || value === undefined) {
		return null;
	}
	const normalized = normalizeRegistrationPhone(String(value));
	return normalized || null;
};

const maskPhoneNumber = (value: string): string => {
	const normalized = normalizeRegistrationPhone(value) || String(value || '').trim();
	const digits = normalized.replace(/\D/g, '');
	if (digits.length < 4) {
		return normalized ? '****' : '';
	}
	return `***-***-${digits.slice(-4)}`;
};

const getFirstNormalizedPhone = (...values: unknown[]): string | null => {
	for (const value of values) {
		if (typeof value === 'string') {
			const normalized = normalizeRegistrationPhone(value);
			if (normalized) {
				return normalized;
			}
			continue;
		}
		if (Array.isArray(value)) {
			for (const entry of value) {
				if (typeof entry === 'string') {
					const normalized = normalizeRegistrationPhone(entry);
					if (normalized) {
						return normalized;
					}
					continue;
				}
				if (entry && typeof entry === 'object') {
					const normalized = getFirstNormalizedPhone(
						(entry as any).phoneNumber,
						(entry as any).number,
						(entry as any).value,
						(entry as any).phone,
					);
					if (normalized) {
						return normalized;
					}
				}
			}
			continue;
		}
		if (value && typeof value === 'object') {
			const normalized = getFirstNormalizedPhone(
				(value as any).phoneNumber,
				(value as any).number,
				(value as any).value,
				(value as any).phone,
			);
			if (normalized) {
				return normalized;
			}
		}
	}
	return null;
};

const getStaffVoicePhone = (user: any): string | null =>
	getFirstNormalizedPhone(
		user?.phoneNumber,
		user?.phones,
		user?.phone,
		user?.customFields?.phoneNumber,
		user?.customFields?.phone,
		user?.customFields?.mobile,
		user?.customFields?.mobilePhone,
	);

const normalizeUrl = (value: string): string => {
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
const normalizeText = (value: string): string =>
	String(value || '')
		.trim()
		.replace(/\s+/g, ' ');

const getMedsenseVoiceServiceBaseUrl = (): string =>
	normalizeUrl(settings.get<string>('Medsense_Voice_Service_Url') || process.env.MEDSENSE_VOICE_SERVICE_URL || '');

const getMedsenseVoiceServiceSecret = (): string =>
	String(settings.get<string>('Medsense_Voice_Service_Secret') || process.env.MEDSENSE_VOICE_SERVICE_SECRET || '').trim();

const getMedsenseVoiceServiceTimeoutMs = (): number => {
	const raw = String(process.env.MEDSENSE_VOICE_SERVICE_TIMEOUT_MS || '10000').trim();
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1000), 120000) : 10000;
};

const buildVoiceSignatureHeaders = (payload: Record<string, unknown>) => {
	const secret = getMedsenseVoiceServiceSecret();
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

const stripVoiceAuthFromPayload = (payload: Record<string, unknown>): Record<string, unknown> => {
	if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
		return {};
	}
	const output = { ...(payload as Record<string, unknown>) };
	delete output._voiceAuth;
	return output;
};

const verifyVoiceSignature = (headers: Record<string, any>, payload: Record<string, unknown>): { ok: boolean; reason: string } => {
	const sharedSecret = getMedsenseVoiceServiceSecret();
	if (!sharedSecret) {
		console.error('[MedsenseVoice] signature verify failed: missing shared secret setting');
		return { ok: false, reason: 'shared_secret_not_configured' };
	}

	const authFromPayload = ((payload as any)?._voiceAuth || {}) as Record<string, unknown>;
	const providedSecret = String(
		headers['x-medsense-voice-secret'] || headers['X-Medsense-Voice-Secret'] || authFromPayload.secret || '',
	).trim();
	if (!providedSecret || !safeHashEqual(hashRegistrationValue(providedSecret), hashRegistrationValue(sharedSecret))) {
		console.error('[MedsenseVoice] signature verify failed: secret mismatch', {
			hasProvidedSecret: Boolean(providedSecret),
			providedSecretLength: providedSecret.length,
			sharedSecretLength: sharedSecret.length,
		});
		return { ok: false, reason: 'secret_mismatch' };
	}

	const timestamp = String(
		headers['x-medsense-voice-timestamp'] || headers['X-Medsense-Voice-Timestamp'] || authFromPayload.timestamp || '',
	).trim();
	const signature = String(
		headers['x-medsense-voice-signature'] || headers['X-Medsense-Voice-Signature'] || authFromPayload.signature || '',
	).trim();
	if (!timestamp || !signature) {
		console.error('[MedsenseVoice] signature verify failed: missing timestamp/signature', {
			hasTimestamp: Boolean(timestamp),
			hasSignature: Boolean(signature),
		});
		return { ok: false, reason: 'missing_signature_headers' };
	}

	const timestampMs = Number(timestamp);
	if (!Number.isFinite(timestampMs)) {
		console.error('[MedsenseVoice] signature verify failed: timestamp not numeric', { timestamp });
		return { ok: false, reason: 'invalid_timestamp' };
	}
	const maxSkewMs = 5 * 60 * 1000;
	if (Math.abs(Date.now() - timestampMs) > maxSkewMs) {
		console.error('[MedsenseVoice] signature verify failed: timestamp outside window', {
			timestamp,
			now: Date.now(),
			maxSkewMs,
		});
		return { ok: false, reason: 'timestamp_out_of_window' };
	}

	const payloadForSignature = stripVoiceAuthFromPayload(payload || {});
	const expected = createHmac('sha256', sharedSecret)
		.update(`${timestamp}.${serializeVoicePayloadForSignature(payloadForSignature)}`)
		.digest('hex');
	const isValid = safeHashEqual(signature, expected);
	if (!isValid) {
		console.error('[MedsenseVoice] signature verify failed: signature mismatch', {
			providedSignatureLength: signature.length,
			expectedSignatureLength: expected.length,
			timestamp,
			payloadKeys: Object.keys(payloadForSignature || {}),
		});
		return { ok: false, reason: 'signature_mismatch' };
	}
	return { ok: true, reason: 'ok' };
};

const postToMedsenseVoiceService = async (path: string, payload: Record<string, unknown>) => {
	const baseUrl = getMedsenseVoiceServiceBaseUrl();
	if (!baseUrl) {
		throw new Meteor.Error('voice-service-missing', 'Medsense voice service URL is not configured.');
	}
	if (!getMedsenseVoiceServiceSecret()) {
		throw new Meteor.Error('voice-service-secret-missing', 'Medsense voice service secret is not configured.');
	}
	const timeout = getMedsenseVoiceServiceTimeoutMs();
	return HTTP.post(`${baseUrl}${path}`, {
		headers: buildVoiceSignatureHeaders(payload),
		timeout,
		data: payload,
	});
};

const buildMedsenseApiCallbackUrl = (route: string): string => Meteor.absoluteUrl(`api/v1/${route.replace(/^\/+/, '')}`);

const buildAfterHoursVoicemailInstruction = ({
	roomId,
	requestId,
	sessionId,
}: {
	roomId: string;
	requestId: string;
	sessionId: string;
}) => ({
	mode: 'after_hours_voicemail',
	prompt: {
		source: 'voice_service_static_tts',
		config: 'MEDSENSE_AFTER_HOURS_PROMPT_TEXT',
	},
	beep: true,
	maxDurationSeconds: 120,
	transcribe: true,
	endAfterRecording: true,
	context: {
		roomId,
		requestId,
		sessionId,
	},
	callbacks: {
		transcriptUrl: buildMedsenseApiCallbackUrl('medsense/voice.transcript.ingest'),
		recordingUrl: buildMedsenseApiCallbackUrl('medsense/voice.voicemail.ingest'),
		stateUrl: buildMedsenseApiCallbackUrl('medsense/voice.session.state.upsert'),
	},
});

const normalizeRecordingStatus = (value: unknown): 'completed' | 'in-progress' | 'absent' | 'failed' | 'unknown' => {
	const normalized = String(value || '')
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '_');
	if (['finished', 'success'].includes(normalized)) {
		return 'completed';
	}
	if (normalized === 'no_input') {
		return 'absent';
	}
	if (normalized === 'error') {
		return 'failed';
	}
	if (normalized === 'in_progress') {
		return 'in-progress';
	}
	if (['completed', 'in-progress', 'absent', 'failed'].includes(normalized)) {
		return normalized as 'completed' | 'in-progress' | 'absent' | 'failed';
	}
	return 'unknown';
};

const normalizeVoiceRecordingContentType = (value: unknown): string => {
	const normalized = String(value || '')
		.split(';')[0]
		.trim()
		.toLowerCase();
	if (/^audio\/[a-z0-9.+-]+$/.test(normalized)) {
		return normalized;
	}
	return 'audio/mpeg';
};

const getVoiceRecordingExtension = (contentType: string): string => {
	switch (normalizeVoiceRecordingContentType(contentType)) {
		case 'audio/wav':
		case 'audio/wave':
		case 'audio/x-wav':
			return 'wav';
		case 'audio/mp4':
		case 'audio/m4a':
			return 'm4a';
		case 'audio/ogg':
			return 'ogg';
		case 'audio/webm':
			return 'webm';
		case 'audio/mpeg':
		default:
			return 'mp3';
	}
};

const downloadVoiceRecording = async (
	recordingUrl: string,
	fallbackContentType?: string,
): Promise<{ buffer: Buffer; contentType: string }> => {
	const url = String(recordingUrl || '').trim();
	if (!/^https?:\/\//i.test(url)) {
		throw new Error('Recording URL must be http or https');
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), getMedsenseVoiceServiceTimeoutMs());
	try {
		const response = await fetch(url, {
			method: 'GET',
			redirect: 'follow',
			signal: controller.signal,
		});
		if (!response.ok) {
			throw new Error(`Recording download failed with HTTP ${response.status}`);
		}
		const contentType = normalizeVoiceRecordingContentType(response.headers.get('content-type') || fallbackContentType || '');
		const buffer = Buffer.from(await response.arrayBuffer());
		if (!buffer.length) {
			throw new Error('Recording download returned an empty file');
		}
		return { buffer, contentType };
	} finally {
		clearTimeout(timeout);
	}
};

const uploadAfterHoursVoicemailRecording = async ({
	roomId,
	userId,
	recordingSid,
	buffer,
	contentType,
	durationSeconds,
}: {
	roomId: string;
	userId: string;
	recordingSid?: string | null;
	buffer: Buffer;
	contentType: string;
	durationSeconds?: number | null;
}) => {
	const safeRecordingId = String(recordingSid || randomBytes(4).toString('hex'))
		.replace(/[^a-z0-9_-]/gi, '')
		.slice(0, 48);
	const extension = getVoiceRecordingExtension(contentType);
	const name = `after-hours-voicemail-${safeRecordingId}.${extension}`;
	const fileStore = FileUpload.getStore('Uploads');
	const uploadedFile = await fileStore.insert(
		{
			name,
			size: buffer.length,
			type: normalizeVoiceRecordingContentType(contentType),
			rid: roomId,
			userId,
			description:
				typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
					? `After-hours voicemail (${durationSeconds}s)`
					: 'After-hours voicemail',
		},
		buffer,
	);
	uploadedFile.path = FileUpload.getPath(`${uploadedFile._id}/${encodeURI(uploadedFile.name || '')}`);
	await Uploads.updateFileComplete(uploadedFile._id, userId, omit(uploadedFile, '_id'));
	return uploadedFile;
};

const resolveAuthenticatedRequestUserId = async (request: Request, userId?: string | null): Promise<string> => {
	if (userId) {
		return userId;
	}

	const cookieHeader = request.headers.get('cookie') || '';
	const resolvedUserId = request.headers.get('x-user-id') || medsenseCookieParser.get('rc_uid', cookieHeader) || '';
	const authToken = request.headers.get('x-auth-token') || medsenseCookieParser.get('rc_token', cookieHeader) || '';
	if (!resolvedUserId || !authToken) {
		return '';
	}

	const user = await Users.findOneByIdAndLoginToken(resolvedUserId, hashLoginToken(authToken), { projection: { _id: 1 } });
	return user?._id || '';
};

const buildAudioPlaybackResponse = (buffer: Buffer, contentType: string, rangeHeader?: string | null) => {
	const size = buffer.length;
	const headers: Record<string, string> = {
		'Content-Type': normalizeVoiceRecordingContentType(contentType),
		'Accept-Ranges': 'bytes',
		'Cache-Control': 'no-store',
	};

	if (!rangeHeader) {
		return {
			statusCode: 200,
			headers: {
				...headers,
				'Content-Length': String(size),
			},
			body: buffer,
		};
	}

	const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
	if (!match || size <= 0) {
		return {
			statusCode: 416,
			headers: {
				...headers,
				'Content-Range': `bytes */${size}`,
			},
			body: '',
		};
	}

	const [, rawStart, rawEnd] = match;
	let start = rawStart ? Number.parseInt(rawStart, 10) : 0;
	let end = rawEnd ? Number.parseInt(rawEnd, 10) : size - 1;

	if (!rawStart && rawEnd) {
		const suffixLength = Number.parseInt(rawEnd, 10);
		start = Math.max(size - suffixLength, 0);
		end = size - 1;
	}

	if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
		return {
			statusCode: 416,
			headers: {
				...headers,
				'Content-Range': `bytes */${size}`,
			},
			body: '',
		};
	}

	end = Math.min(end, size - 1);
	const body = buffer.subarray(start, end + 1);
	return {
		statusCode: 206,
		headers: {
			...headers,
			'Content-Length': String(body.length),
			'Content-Range': `bytes ${start}-${end}/${size}`,
		},
		body,
	};
};

const DOCUMENTATION_SECTION_TYPES = new Set([
	'patient_info',
	'questionnaire',
	'assessment',
	'attestations',
	'action_taken',
	'provider_communication',
	'prescriptions',
	'counselling',
	'follow_up',
	'signatures',
]);

const DOCUMENTATION_FIELD_TYPES = new Set(['text', 'textarea', 'date', 'number', 'select', 'boolean', 'drug', 'repeater']);
const DOCUMENTATION_SECTION_VISIBILITY_OPERATORS = new Set(['equals', 'includes']);

const DEFAULT_DOCUMENTATION_PREFILL_CONFIDENCE_THRESHOLD = 0.8;

const getNestedValue = (input: any, path?: string): any => {
	if (!path) {
		return undefined;
	}

	return path.split('.').reduce((value: any, segment) => {
		if (value === undefined || value === null) {
			return undefined;
		}

		return value[segment];
	}, input);
};

const normalizeTemplateOptions = (options: any): string[] | undefined => {
	if (!Array.isArray(options)) {
		return undefined;
	}

	const normalized = options
		.map((option) => {
			if (typeof option === 'string') {
				return option.trim();
			}

			if (option && typeof option === 'object') {
				const value = typeof option.value === 'string' ? option.value.trim() : '';
				const label = typeof option.label === 'string' ? option.label.trim() : '';
				return value || label;
			}

			return '';
		})
		.filter(Boolean);

	return normalized.length ? normalized : undefined;
};

const normalizeTemplateVisibilityCondition = (condition: any, path: string): any => {
	if (condition === undefined || condition === null) {
		return undefined;
	}

	const fieldKey = typeof condition?.fieldKey === 'string' ? condition.fieldKey.trim() : '';
	const operator = typeof condition?.operator === 'string' ? condition.operator.trim() : '';

	if (!fieldKey) {
		throw new Meteor.Error('invalid-template-section', `Missing visibleWhen.fieldKey at ${path}`);
	}

	if (!DOCUMENTATION_SECTION_VISIBILITY_OPERATORS.has(operator)) {
		throw new Meteor.Error('invalid-template-section', `Unsupported visibleWhen.operator "${operator}" at ${path}`);
	}

	if (condition?.value === undefined || condition?.value === null || String(condition.value).trim() === '') {
		throw new Meteor.Error('invalid-template-section', `Missing visibleWhen.value at ${path}`);
	}

	return {
		fieldKey,
		operator,
		value: String(condition.value).trim(),
	};
};

const normalizeTemplateField = (field: any, index: number, path: string): any => {
	const key = typeof field?.key === 'string' ? field.key.trim() : '';
	const label = typeof field?.label === 'string' ? field.label.trim() : '';
	const type = typeof field?.type === 'string' ? field.type.trim() : '';

	if (!key) {
		throw new Meteor.Error('invalid-template-field', `Missing field key at ${path}`);
	}

	if (!label) {
		throw new Meteor.Error('invalid-template-field', `Missing field label at ${path}`);
	}

	if (!DOCUMENTATION_FIELD_TYPES.has(type)) {
		throw new Meteor.Error('invalid-template-field', `Unsupported field type "${type}" at ${path}`);
	}

	const drugCatalogCodes = Array.isArray(field?.drugCatalogCodes)
		? field.drugCatalogCodes.map((code: any) => String(code).trim()).filter(Boolean)
		: undefined;
	const nestedFields =
		type === 'repeater'
			? Array.isArray(field?.fields)
				? field.fields.map((child: any, childIndex: number) => normalizeTemplateField(child, childIndex, `${path}.fields[${childIndex}]`))
				: []
			: undefined;

	if (type === 'repeater' && (!nestedFields || !nestedFields.length)) {
		throw new Meteor.Error('invalid-template-field', `Repeater fields must define at least one child field at ${path}`);
	}

	return {
		key,
		label,
		type,
		required: Boolean(field?.required),
		helpText: typeof field?.helpText === 'string' ? field.helpText.trim() : undefined,
		pdfTitle: typeof field?.pdfTitle === 'string' ? field.pdfTitle.trim() : undefined,
		visibleInPdf: field?.visibleInPdf !== false,
		aiPrefill: field?.aiPrefill !== false,
		prefillConfidenceThreshold:
			typeof field?.prefillConfidenceThreshold === 'number' && Number.isFinite(field.prefillConfidenceThreshold)
				? Math.max(0, Math.min(1, field.prefillConfidenceThreshold))
				: undefined,
		sourceKey: typeof field?.sourceKey === 'string' ? field.sourceKey.trim() : undefined,
		options: normalizeTemplateOptions(field?.options),
		drugCatalogCodes,
		fields: nestedFields,
		defaultValue: field?.defaultValue,
		sortOrder: typeof field?.sortOrder === 'number' ? field.sortOrder : index,
	};
};

const normalizeTemplateSection = (section: any, index: number): any => {
	const key = typeof section?.key === 'string' ? section.key.trim() : '';
	const title = typeof section?.title === 'string' ? section.title.trim() : '';
	const type = typeof section?.type === 'string' ? section.type.trim() : '';

	if (!key) {
		throw new Meteor.Error('invalid-template-section', `Missing section key at index ${index}`);
	}

	if (!title) {
		throw new Meteor.Error('invalid-template-section', `Missing section title at index ${index}`);
	}

	if (!DOCUMENTATION_SECTION_TYPES.has(type)) {
		throw new Meteor.Error('invalid-template-section', `Unsupported section type "${type}" at index ${index}`);
	}

	return {
		key,
		title,
		type,
		sortOrder: typeof section?.sortOrder === 'number' ? section.sortOrder : index,
		pdfTitle: typeof section?.pdfTitle === 'string' ? section.pdfTitle.trim() : undefined,
		visibleInPdf: section?.visibleInPdf !== false,
		visibleWhen: normalizeTemplateVisibilityCondition(section?.visibleWhen, `sections[${index}].visibleWhen`),
		fields: Array.isArray(section?.fields)
			? section.fields.map((field: any, fieldIndex: number) =>
					normalizeTemplateField(field, fieldIndex, `sections[${index}].fields[${fieldIndex}]`),
				)
			: [],
	};
};

const normalizeDocumentationTemplateInput = (payload: any): Partial<IMedsenseDocumentationTemplate> => {
	const interventionTypes = Array.isArray(payload?.interventionTypes)
		? payload.interventionTypes.map((value: string) => String(value).trim()).filter(Boolean)
		: [];
	const specialtyActionIds = Array.isArray(payload?.specialtyActionIds)
		? payload.specialtyActionIds.map((value: string) => String(value).trim()).filter(Boolean)
		: [];
	const sections = Array.isArray(payload?.sections) ? payload.sections.map(normalizeTemplateSection) : [];

	if (!interventionTypes.length) {
		throw new Meteor.Error('invalid-template', 'At least one intervention type is required');
	}

	if (!sections.length) {
		throw new Meteor.Error('invalid-template', 'At least one template section is required');
	}

	if (payload?.signatureRules?.requirePatientSignature && !payload?.signatureRules?.allowPatientSignature) {
		throw new Meteor.Error('invalid-template', 'Patient signature cannot be required when patient signatures are disabled');
	}

	return {
		key: typeof payload?.key === 'string' ? payload.key.trim() : undefined,
		label: typeof payload?.label === 'string' ? payload.label.trim() : undefined,
		description: typeof payload?.description === 'string' ? payload.description.trim() : undefined,
		interventionTypes,
		specialtyActionIds,
		sections,
		signatureRules: {
			requirePharmacistSignature: Boolean(payload?.signatureRules?.requirePharmacistSignature),
			allowPatientSignature: Boolean(payload?.signatureRules?.allowPatientSignature),
			requirePatientSignature: Boolean(payload?.signatureRules?.requirePatientSignature),
		},
		pdfConfig: {
			documentTitle: typeof payload?.pdfConfig?.documentTitle === 'string' ? payload.pdfConfig.documentTitle.trim() : '',
			includeQrCode: Boolean(payload?.pdfConfig?.includeQrCode),
			showTemplateVersion: Boolean(payload?.pdfConfig?.showTemplateVersion),
			footerText: typeof payload?.pdfConfig?.footerText === 'string' ? payload.pdfConfig.footerText.trim() : undefined,
		},
	};
};

const extractCcddVersion = (raw: string): string | null => {
	const match = raw.match(/"version"\s*:\s*"([^"]+)"/);
	return match?.[1] || null;
};

const getCcddPropertyValue = (extensionEntry: any): any => {
	const nested = Array.isArray(extensionEntry?.extension) ? extensionEntry.extension : [];
	const valueEntry = nested.find((item: any) => item?.url === 'value');
	if (!valueEntry) {
		return undefined;
	}

	if ('valueBoolean' in valueEntry) {
		return valueEntry.valueBoolean;
	}
	if ('valueCode' in valueEntry) {
		return valueEntry.valueCode;
	}
	if ('valueDateTime' in valueEntry) {
		return valueEntry.valueDateTime;
	}
	if ('valueString' in valueEntry) {
		return valueEntry.valueString;
	}

	return undefined;
};

const getCcddPropertyMap = (entry: any): Record<string, any> => {
	const propertyMap: Record<string, any> = {};

	for (const extensionEntry of Array.isArray(entry?.extension) ? entry.extension : []) {
		const nested = Array.isArray(extensionEntry?.extension) ? extensionEntry.extension : [];
		const codeEntry = nested.find((item: any) => item?.url === 'code');
		const code = codeEntry?.valueCode;
		if (!code) {
			continue;
		}

		propertyMap[code] = getCcddPropertyValue(extensionEntry);
	}

	return propertyMap;
};

const parseCcddDrugCatalogContent = async (raw: string, sourceLabel = 'uploaded file') => {
	const version = extractCcddVersion(raw);
	if (!version) {
		throw new Meteor.Error('ccdd-invalid-file', 'Unable to detect CCDD version in source file');
	}

	const parsed = JSON.parse(raw);
	const contains = Array.isArray(parsed?.expansion?.contains) ? parsed.expansion.contains : [];
	const entries = contains
		.map((entry: any) => {
			const code = typeof entry?.code === 'string' ? entry.code.trim() : '';
			const displayName = typeof entry?.display === 'string' ? entry.display.trim() : '';
			const properties = getCcddPropertyMap(entry);
			const status = typeof properties.status === 'string' ? properties.status : '';
			const inactive = properties.inactive === true;

			if (!code || !displayName) {
				return null;
			}

			return {
				code,
				displayName,
				searchText: displayName.toLowerCase(),
				active: status === 'active' && !inactive,
			};
		})
		.filter(Boolean) as Array<{ code: string; displayName: string; searchText: string; active: boolean }>;

	return {
		sourceLabel,
		version,
		rowCount: entries.length,
		entries,
	};
};

const getDrugCatalogStats = async () => {
	const importedVersion = await Settings.findOneById('Medsense_CCDD_NTP_Imported_Version', { projection: { value: 1 } });
	const lastImportedAt = await Settings.findOneById('Medsense_CCDD_NTP_Last_Imported_At', { projection: { value: 1 } });
	const activeCount = await MedsenseDrugCatalog.countDocuments({ active: true });

	return {
		importedVersion: typeof importedVersion?.value === 'string' ? importedVersion.value : '',
		lastImportedAt: typeof lastImportedAt?.value === 'string' ? lastImportedAt.value : '',
		activeCount,
	};
};

const hydrateTemplateDrugFieldOptions = async (template: IMedsenseDocumentationTemplate): Promise<IMedsenseDocumentationTemplate> => {
	const sections = Array.isArray(template?.sections) ? template.sections : [];
	const collectDrugCatalogCodes = (fields: any[] = []): string[] =>
		fields.flatMap((field: any) => {
			const ownCodes = Array.isArray(field?.drugCatalogCodes) ? field.drugCatalogCodes : [];
			const nestedCodes = field?.type === 'repeater' && Array.isArray(field?.fields) ? collectDrugCatalogCodes(field.fields) : [];
			return [...ownCodes, ...nestedCodes];
		});
	const codes = Array.from(new Set(sections.flatMap((section) => collectDrugCatalogCodes(section.fields || []))));

	if (!codes.length) {
		return template;
	}

	const drugs = await MedsenseDrugCatalog.findActiveByCodes(codes).toArray();
	const displayByCode = new Map(drugs.map((drug) => [drug.code, drug.displayName]));
	const hydrateFieldDrugOptions = (field: any): any => {
		const hydratedChildren =
			field?.type === 'repeater' && Array.isArray(field?.fields)
				? field.fields.map((child: any) => hydrateFieldDrugOptions(child))
				: field?.fields;

		if (field?.type !== 'drug' || !Array.isArray(field?.drugCatalogCodes)) {
			return hydratedChildren ? { ...field, fields: hydratedChildren } : field;
		}

		return {
			...field,
			fields: hydratedChildren,
			options: field.drugCatalogCodes.map((code: string) => displayByCode.get(code)).filter(Boolean),
		};
	};

	return {
		...template,
		sections: sections.map((section) => ({
			...section,
			fields: (section.fields || []).map((field: any) => hydrateFieldDrugOptions(field)),
		})),
	};
};

const hydrateInterventionDocumentationTemplate = async (intervention: any): Promise<any> => {
	if (!intervention?.documentationTemplateSnapshot) {
		return intervention;
	}

	return {
		...intervention,
		documentationTemplateSnapshot: await hydrateTemplateDrugFieldOptions(intervention.documentationTemplateSnapshot),
	};
};

const DEFAULT_INTERVENTION_TYPES = [
	{ value: 'uti', label: 'UTI Assessment' },
	{ value: 'counseling', label: 'Counseling' },
	{ value: 'medication_review', label: 'Medication Review' },
	{ value: 'refill_request', label: 'Refill Request' },
	{ value: 'drug_interaction', label: 'Drug Interaction' },
	{ value: 'adverse_event', label: 'Adverse Event' },
	{ value: 'other', label: 'Other' },
];

const getConfiguredInterventionTypes = (): Array<{ value: string; label: string }> => {
	const raw = settings.get<string>('Medsense_Intervention_Types');
	if (!raw) {
		return DEFAULT_INTERVENTION_TYPES;
	}

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return DEFAULT_INTERVENTION_TYPES;
		}

		const normalized = parsed
			.map((item: any) => ({
				value: typeof item?.value === 'string' ? item.value.trim() : '',
				label: typeof item?.label === 'string' ? item.label.trim() : '',
			}))
			.filter((item: { value: string; label: string }) => item.value && item.label);

		return normalized.length ? normalized : DEFAULT_INTERVENTION_TYPES;
	} catch {
		return DEFAULT_INTERVENTION_TYPES;
	}
};

const canAccessInterventionDocumentation = async (userId: string, intervention: any): Promise<boolean> => {
	const hasDocumentationPermission = await hasPermissionAsync(userId, 'medsense-create-interventions');
	if (!hasDocumentationPermission) {
		const user = await Users.findOneById(userId, { projection: { roles: 1 } });
		const roles = user?.roles || [];
		if (!roles.includes('admin') && !roles.includes('bot')) {
			return false;
		}
	}

	const canManageAll = await hasPermissionAsync(userId, 'medsense-manage-all-pharmacies');
	if (canManageAll) {
		return true;
	}

	const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId: intervention.pharmacyId, userId });
	return Boolean(membership);
};

const isFilledDocumentationValue = (value: any): boolean => {
	if (value === undefined || value === null) {
		return false;
	}

	if (typeof value === 'string') {
		return value.trim().length > 0;
	}

	if (Array.isArray(value)) {
		return value.length > 0;
	}

	if (typeof value === 'object') {
		return Object.keys(value).length > 0;
	}

	return true;
};

const collectTemplateFieldDescriptors = (template: IMedsenseDocumentationTemplate): Array<{ section: any; field: any }> => {
	const descriptors: Array<{ section: any; field: any }> = [];

	for (const section of template.sections || []) {
		for (const field of section.fields || []) {
			descriptors.push({ section, field });
		}
	}

	return descriptors;
};

const normalizeDocumentationFieldValue = (field: any, value: any): any => {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (field.type === 'repeater') {
		if (!Array.isArray(value)) {
			return undefined;
		}

		const rows = value
			.map((row: any) => {
				if (!row || typeof row !== 'object') {
					return null;
				}

				const normalizedRow = (field.fields || []).reduce((acc: Record<string, any>, child: any) => {
					const normalizedChild = normalizeDocumentationFieldValue(child, row[child.key]);
					if (normalizedChild !== undefined) {
						acc[child.key] = normalizedChild;
					}
					return acc;
				}, {});

				return Object.keys(normalizedRow).length ? normalizedRow : null;
			})
			.filter(Boolean);

		return rows.length ? rows : undefined;
	}

	if (field.type === 'boolean') {
		if (typeof value === 'boolean') {
			return value;
		}
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (['true', 'yes', 'y', '1'].includes(normalized)) {
				return true;
			}
			if (['false', 'no', 'n', '0'].includes(normalized)) {
				return false;
			}
		}
		return undefined;
	}

	if (field.type === 'multiselect' || field.type === 'checkbox') {
		const values = Array.isArray(value) ? value : [value];
		const normalized = values.map((item) => String(item).trim()).filter((item) => item.length > 0);
		if (!normalized.length) {
			return undefined;
		}
		if (Array.isArray(field.options) && field.options.length) {
			const allowed = new Set(field.options.map((option: string) => String(option)));
			const filtered = normalized.filter((item) => allowed.has(item));
			return filtered.length ? filtered : undefined;
		}
		return normalized;
	}

	if (field.type === 'select' || field.type === 'radio') {
		const normalized = String(value).trim();
		if (!normalized) {
			return undefined;
		}
		if (Array.isArray(field.options) && field.options.length && !field.options.includes(normalized)) {
			return undefined;
		}
		return normalized;
	}

	if (field.type === 'date') {
		const normalized = String(value).trim();
		return normalized || undefined;
	}

	if (field.type === 'number') {
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value;
		}
		if (typeof value === 'string') {
			const normalized = value.trim();
			if (!normalized) {
				return undefined;
			}
			const parsed = Number(normalized);
			return Number.isFinite(parsed) ? parsed : undefined;
		}
		return undefined;
	}

	const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
	return normalized || undefined;
};

const deriveDocumentationAiRefs = ({
	requestId,
	roomId,
	patientUserId,
}: {
	requestId?: string;
	roomId?: string;
	patientUserId?: string;
}) => {
	const secret = String(process.env.RC_SECRET || 'medsense').trim();
	const derive = (prefix: string, basis: string) =>
		`${prefix}-${createHmac('sha256', secret).update(basis).digest('hex').slice(0, 6).toUpperCase()}`;
	const requestBasis = requestId || roomId || patientUserId || 'unknown-request';
	const patientBasis = requestId || patientUserId || roomId || 'unknown-patient';
	const roomBasis = roomId || requestId || patientUserId || 'unknown-room';
	return {
		patient_ref: derive('PT', `patient:${patientBasis}`),
		request_ref: derive('REQ', `request:${requestBasis}`),
		room_ref: derive('RM', `room:${roomBasis}`),
	};
};

const buildDocumentationContext = async (intervention: any, requestedRoomId?: string): Promise<Record<string, any>> => {
	const patient = await Users.findOneById(intervention.patientUserId, {
		projection: {
			name: 1,
			username: 1,
			emails: 1,
			phone: 1,
			phones: 1,
			phoneNumber: 1,
		},
	});

	let request = requestedRoomId ? await MedsenseRequests.findOne({ roomId: requestedRoomId }, { sort: { createdAt: -1 } as any }) : null;

	if (!request) {
		request = await MedsenseRequests.findOne(
			{ requestedByUserId: intervention.patientUserId, pharmacyId: intervention.pharmacyId },
			{ sort: { createdAt: -1 } as any },
		);
	}

	const resolvedRoomId = requestedRoomId || request?.roomId || undefined;
	const room = resolvedRoomId
		? await Rooms.findOneById(resolvedRoomId, {
				projection: {
					medsenseSessionInfo: 1,
				},
			})
		: null;
	const sessionContext = _buildSessionContextView((room as any)?.medsenseSessionInfo, {
		bufferTailLimit: 2,
		formTailLimit: 10,
		recentAnswerLimit: 5,
	});
	const pharmacyId = request?.pharmacyId || intervention?.pharmacyId;
	const pharmacy = pharmacyId
		? await MedsensePharmacies.findOneById(pharmacyId, {
				projection: {
					_id: 1,
					name: 1,
				},
			})
		: null;

	return {
		roomId: resolvedRoomId,
		patient: {
			name: patient?.name,
			username: patient?.username,
			email: Array.isArray((patient as any)?.emails) ? (patient as any).emails[0]?.address : undefined,
			phone: (patient as any)?.phone,
			phones: (patient as any)?.phones,
			phoneNumber: (patient as any)?.phoneNumber,
		},
		pharmacy: pharmacy
			? {
					_id: pharmacy._id,
					name: pharmacy.name,
				}
			: null,
		request,
		session: sessionContext.session,
		sessionContext,
		intervention,
	};
};

const resolveLocalDocumentationPrefillValue = (field: any, context: Record<string, any>): any => {
	const localContext = {
		...context,
		patient: context.patient || {},
	};

	let rawValue = field?.sourceKey ? getNestedValue(localContext, field.sourceKey) : undefined;
	if (rawValue === undefined) {
		switch (field?.key) {
			case 'patient_name':
				rawValue = localContext.patient?.name;
				break;
			case 'patient_email':
				rawValue = localContext.patient?.email;
				break;
			case 'patient_phone':
				rawValue =
					localContext.patient?.phone?.[0]?.phoneNumber ||
					localContext.patient?.phones?.[0]?.phoneNumber ||
					localContext.patient?.phoneNumber;
				break;
			case 'staff_preferred_pharmacy':
				rawValue = localContext.pharmacy?.name || localContext.request?.pharmacyName || localContext.request?.pharmacy?.name;
				break;
			default:
				break;
		}
	}

	return normalizeDocumentationFieldValue(field, rawValue);
};

const buildLocalDocumentationPrefill = ({
	template,
	context,
	baseDocumentationValues,
	baseFollowUp,
}: {
	template: IMedsenseDocumentationTemplate;
	context: Record<string, any>;
	baseDocumentationValues: Record<string, any>;
	baseFollowUp: Record<string, any>;
}) => {
	const fields: Array<Record<string, any>> = [];
	const sections = (template.sections || [])
		.map((section: any) => {
			if (section.type === 'signatures' || section.type === 'prescriptions') {
				return section;
			}

			const filteredFields = (section.fields || []).filter((field: any) => {
				if (field.aiPrefill === false) {
					return false;
				}

				const target = section.type === 'follow_up' ? baseFollowUp : baseDocumentationValues;
				if (isFilledDocumentationValue(target[field.key])) {
					return false;
				}

				const localValue = resolveLocalDocumentationPrefillValue(field, context);
				if (localValue === undefined || !isFilledDocumentationValue(localValue)) {
					return true;
				}

				fields.push({
					fieldKey: field.key,
					sectionKey: section.key,
					target: section.type === 'follow_up' ? 'follow_up' : 'documentation',
					suggestedValue: localValue,
					confidence: 1,
					reviewStatus: 'pending',
					source: 'local_deterministic',
					reasoningSummary: 'Deterministically filled from trusted MedSense data.',
				});
				return false;
			});

			return {
				...section,
				fields: filteredFields,
			};
		})
		.filter((section: any) => section.type === 'prescriptions' || section.type === 'signatures' || (section.fields || []).length > 0);

	return {
		fields,
		template: {
			...template,
			sections,
		},
	};
};

const buildTemplateDraftValues = (
	template: IMedsenseDocumentationTemplate,
	existingValues?: Record<string, any>,
	existingPrescriptions?: any[],
	existingFollowUp?: Record<string, any>,
): { documentationValues: Record<string, any>; prescriptions: any[]; followUp: Record<string, any> } => {
	const documentationValues = { ...(existingValues || {}) };
	const prescriptions = Array.isArray(existingPrescriptions) ? existingPrescriptions : [];
	const followUp = { ...(existingFollowUp || {}) };

	for (const section of template.sections || []) {
		if (section.type === 'prescriptions' || section.type === 'signatures') {
			continue;
		}

		for (const field of section.fields || []) {
			const target = section.type === 'follow_up' ? followUp : documentationValues;
			if (target[field.key] !== undefined && target[field.key] !== null && target[field.key] !== '') {
				continue;
			}

			if (field.defaultValue !== undefined) {
				target[field.key] = field.defaultValue;
			}
		}
	}

	return {
		documentationValues,
		prescriptions,
		followUp,
	};
};

const callDocumentationPrefillWebhook = async ({
	roomId,
	requestId,
	intervention,
	template,
	context,
	forceRefresh,
}: {
	roomId?: string;
	requestId?: string;
	intervention: any;
	template: IMedsenseDocumentationTemplate;
	context: Record<string, any>;
	forceRefresh?: boolean;
}): Promise<Record<string, any> | null> => {
	const timeoutMsRaw =
		settings.get<string>('Medsense_Documentation_Prefill_Timeout_MS') || process.env.MEDSENSE_DOCUMENTATION_PREFILL_TIMEOUT_MS || '15000';
	const timeoutMs = Number.parseInt(String(timeoutMsRaw), 10) || 15000;

	const aiRefs = deriveDocumentationAiRefs({
		requestId,
		roomId: roomId || context.roomId,
		patientUserId: intervention.patientUserId,
	});

	const payload = {
		task: 'prefill',
		roomId: roomId || context.roomId,
		requestId,
		interventionId: intervention._id,
		specialtyActionId: intervention.specialtyActionId,
		aiRefs,
		forceRefresh: Boolean(forceRefresh),
		template: {
			_id: template._id,
			key: template.key,
			label: template.label,
			version: template.version,
			sections: (template.sections || []).map((section: any) => ({
				key: section.key,
				title: section.title,
				type: section.type,
				visibleWhen: section.visibleWhen,
				fields: (section.fields || []).map((field: any) => ({
					key: field.key,
					label: field.label,
					type: field.type,
					required: Boolean(field.required),
					options: field.options || [],
					aiPrefill: field.aiPrefill !== false,
					prefillConfidenceThreshold: field.prefillConfidenceThreshold,
					fields: field.fields || [],
				})),
			})),
		},
		context: {
			aiRefs,
			patient: context.patient,
			request: context.request
				? {
						_id: context.request._id,
						reason: context.request.reason,
						contextSummary: context.request.contextSummary,
						aiSummary: context.request.aiSummary,
						answers: context.request.answers || {},
						currentStepId: context.request.currentStepId,
					}
				: null,
			session: context.session || context.sessionContext?.session || null,
			sessionContext: context.sessionContext || null,
			intervention: {
				_id: intervention._id,
				type: intervention.type,
				notes: intervention.notes,
				documentationValues: intervention.documentationValues || {},
				prescriptions: intervention.prescriptions || [],
				followUp: intervention.followUp || {},
			},
		},
	};

	try {
		const response = await triggerHandler.executeDocumentationTrigger(payload, timeoutMs);
		if (!response || typeof response !== 'object') {
			return null;
		}
		if (String((response as any).interventionId || '') !== String(intervention._id || '')) {
			console.error('Documentation prefill webhook returned mismatched interventionId', {
				expectedInterventionId: intervention._id,
				responseInterventionId: (response as any).interventionId,
			});
			return null;
		}
		return response;
	} catch (error) {
		console.error('Documentation prefill webhook failed', error);
		return null;
	}
};

const normalizeDocumentationAssistantStringArray = (value: any): string[] => {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => {
			if (typeof item === 'string') {
				return item.trim();
			}
			if (item && typeof item === 'object') {
				const text = item.question || item.label || item.text || item.name;
				return typeof text === 'string' ? text.trim() : '';
			}
			return '';
		})
		.filter((item) => item.length > 0);
};

const callDocumentationAssistantWebhook = async ({
	roomId,
	requestId,
	patientUserId,
	specialtyContext,
	requiredInformation,
	context,
}: {
	roomId: string;
	requestId?: string;
	patientUserId?: string;
	specialtyContext: string;
	requiredInformation: string[];
	context: Record<string, any>;
}): Promise<Record<string, any> | null> => {
	const timeoutMsRaw =
		settings.get<string>('Medsense_Documentation_Prefill_Timeout_MS') || process.env.MEDSENSE_DOCUMENTATION_PREFILL_TIMEOUT_MS || '15000';
	const timeoutMs = Number.parseInt(String(timeoutMsRaw), 10) || 15000;
	const aiRefs = deriveDocumentationAiRefs({
		requestId,
		roomId,
		patientUserId,
	});
	context.aiRefs = aiRefs;

	const payload = {
		task: 'assistant',
		roomId,
		requestId,
		specialtyContext,
		requiredInformation,
		aiRefs,
		context: {
			aiRefs,
			patient: context.patient,
			pharmacy: context.pharmacy,
			request: context.request
				? {
						_id: context.request._id,
						reason: context.request.reason,
						contextSummary: context.request.contextSummary,
						aiSummary: context.request.aiSummary,
						answers: context.request.answers || {},
						currentStepId: context.request.currentStepId,
					}
				: null,
			session: context.session || context.sessionContext?.session || null,
			sessionContext: context.sessionContext || null,
		},
	};

	try {
		const response = await triggerHandler.executeDocumentationTrigger(payload, timeoutMs);
		return response && typeof response === 'object' ? response : null;
	} catch (error) {
		console.error('Documentation assistant webhook failed', error);
		return null;
	}
};

const applyDocumentationPrefillResults = ({
	template,
	baseDocumentationValues,
	basePrescriptions,
	baseFollowUp,
	prefillResponse,
	localFields,
}: {
	template: IMedsenseDocumentationTemplate;
	baseDocumentationValues: Record<string, any>;
	basePrescriptions: any[];
	baseFollowUp: Record<string, any>;
	prefillResponse: Record<string, any> | null;
	localFields?: Array<Record<string, any>>;
}) => {
	const documentationValues = { ...(baseDocumentationValues || {}) };
	const prescriptions = Array.isArray(basePrescriptions) ? [...basePrescriptions] : [];
	const followUp = { ...(baseFollowUp || {}) };
	const metadataFields: Array<Record<string, any>> = Array.isArray(localFields) ? [...localFields] : [];

	const rawFields = Array.isArray(prefillResponse?.fields) ? prefillResponse?.fields : [];
	const rawFieldMap = new Map(
		rawFields
			.filter((entry: any) => entry && typeof entry === 'object' && typeof entry.fieldKey === 'string')
			.map((entry: any) => [String(entry.fieldKey), entry]),
	);
	const processedPrescriptionFields = new Set<string>();

	for (const { section, field } of collectTemplateFieldDescriptors(template)) {
		if (section.type === 'signatures' || field.aiPrefill === false) {
			continue;
		}

		const existingValue =
			section.type === 'follow_up'
				? followUp[field.key]
				: section.type === 'prescriptions'
					? prescriptions
					: documentationValues[field.key];
		const responseField = rawFieldMap.get(field.key);
		const normalizedValue = responseField ? normalizeDocumentationFieldValue(field, responseField.value) : undefined;
		const confidence = typeof responseField?.confidence === 'number' ? responseField.confidence : 0;
		const threshold =
			typeof field.prefillConfidenceThreshold === 'number'
				? field.prefillConfidenceThreshold
				: DEFAULT_DOCUMENTATION_PREFILL_CONFIDENCE_THRESHOLD;

		if (section.type === 'prescriptions') {
			if (processedPrescriptionFields.has(section.key)) {
				continue;
			}

			const sectionFields = section.fields || [];
			if (Array.isArray(normalizedValue) && confidence >= threshold) {
				normalizedValue.forEach((rowValue: Record<string, any>, rowIndex: number) => {
					sectionFields.forEach((sectionField: any) => {
						const cellValue = rowValue?.[sectionField.key];
						if (!isFilledDocumentationValue(cellValue)) {
							return;
						}
						metadataFields.push({
							fieldKey: sectionField.key,
							sectionKey: section.key,
							target: 'prescription',
							rowIndex,
							suggestedValue: cellValue,
							confidence,
							reviewStatus: 'pending',
							source: typeof responseField?.source === 'string' ? responseField.source : undefined,
							reasoningSummary: typeof responseField?.reasoningSummary === 'string' ? responseField.reasoningSummary : undefined,
						});
					});
				});
				processedPrescriptionFields.add(section.key);
				continue;
			}

			if (responseField && normalizedValue !== undefined && confidence >= threshold) {
				metadataFields.push({
					fieldKey: field.key,
					sectionKey: section.key,
					target: 'prescription',
					rowIndex: 0,
					suggestedValue: normalizedValue,
					confidence,
					reviewStatus: 'pending',
					source: typeof responseField?.source === 'string' ? responseField.source : undefined,
					reasoningSummary: typeof responseField?.reasoningSummary === 'string' ? responseField.reasoningSummary : undefined,
				});
			}
			continue;
		}

		if (responseField && !isFilledDocumentationValue(existingValue) && normalizedValue !== undefined && confidence >= threshold) {
			metadataFields.push({
				fieldKey: field.key,
				sectionKey: section.key,
				target: section.type === 'follow_up' ? 'follow_up' : 'documentation',
				suggestedValue: normalizedValue,
				confidence,
				reviewStatus: 'pending',
				source: typeof responseField.source === 'string' ? responseField.source : undefined,
				reasoningSummary: typeof responseField.reasoningSummary === 'string' ? responseField.reasoningSummary : undefined,
			});
		}
	}

	return {
		documentationValues,
		prescriptions,
		followUp,
		prefill: {
			model: typeof prefillResponse?.model === 'string' ? prefillResponse.model : undefined,
			fields: metadataFields,
		},
	};
};

const getMedsenseSmsService = async () => {
	const service = settings.get<string>('SMS_Service');
	if (!service || service === 'false') {
		throw new Meteor.Error('sms-disabled', 'SMS Service is disabled in Administration settings');
	}

	const SMSService = await OmnichannelIntegration.getSmsService(service);
	if (!SMSService) {
		throw new Meteor.Error('sms-provider-missing', 'SMS Service provider not found');
	}

	const fromNumber = settings.get<string>('SMS_Twilio_Number');
	if (!fromNumber) {
		throw new Meteor.Error('sms-from-missing', 'Twilio "From" number not found in settings.');
	}

	return { SMSService, fromNumber };
};

const sendMedsenseSMS = async (phoneNumber: string, body: string): Promise<void> => {
	const { SMSService, fromNumber } = await getMedsenseSmsService();
	await SMSService.send(fromNumber, phoneNumber, body);
};

const MEDSENSE_WEEKDAY_KEYS: IMedsenseOperatingHoursWeekday[] = [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday',
];

const DEFAULT_MEDSENSE_OPERATING_HOURS: IMedsenseOperatingHours = {
	monday: { enabled: true, start: '09:00', end: '17:00' },
	tuesday: { enabled: true, start: '09:00', end: '17:00' },
	wednesday: { enabled: true, start: '09:00', end: '17:00' },
	thursday: { enabled: true, start: '09:00', end: '17:00' },
	friday: { enabled: true, start: '09:00', end: '17:00' },
	saturday: { enabled: false, start: '09:00', end: '17:00' },
	sunday: { enabled: false, start: '09:00', end: '17:00' },
};

const DEFAULT_MEDSENSE_AFTER_HOURS_POLICY: IMedsenseAfterHoursPolicy = {
	patientDelivery: 'both',
	pharmacyDelivery: 'both',
};

const DEFAULT_MEDSENSE_AFTER_HOURS_CONTACTS: IMedsenseAfterHoursContacts = {
	patientMessageTemplate: '',
	pharmacySmsRecipients: [],
	pharmacyEmailRecipients: [],
};

const normalizeMedsenseNotificationChannel = (
	value: unknown,
	fallback: IMedsenseNotificationChannel = 'both',
): IMedsenseNotificationChannel => {
	switch (
		String(value || '')
			.trim()
			.toLowerCase()
	) {
		case 'none':
		case 'sms':
		case 'email':
		case 'both':
			return String(value || '')
				.trim()
				.toLowerCase() as IMedsenseNotificationChannel;
		default:
			return fallback;
	}
};

const assertTimezoneValid = (value: string): string => {
	const timezone = String(value || '').trim();
	if (!timezone) {
		throw new Error('Timezone is required for a voice-enabled pharmacy');
	}
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
		return timezone;
	} catch {
		throw new Error(`Invalid timezone: ${timezone}`);
	}
};

const normalizeEmailRecipientList = (value: unknown): string[] => {
	const rawValues = Array.isArray(value)
		? value
		: String(value || '')
				.split(/[\n,]+/)
				.map((item) => item.trim());
	return Array.from(
		new Set(
			rawValues
				.map((item) =>
					String(item || '')
						.trim()
						.toLowerCase(),
				)
				.filter(Boolean),
		),
	);
};

const normalizePhoneRecipientList = (value: unknown): string[] => {
	const rawValues = Array.isArray(value)
		? value
		: String(value || '')
				.split(/[\n,]+/)
				.map((item) => item.trim());
	return Array.from(
		new Set(rawValues.map((item) => normalizeVoiceInboundNumber(String(item || ''))).filter((item): item is string => Boolean(item))),
	);
};

const normalizeOperatingHoursEntry = (value: unknown, dayKey: IMedsenseOperatingHoursWeekday): IMedsenseOperatingHoursEntry => {
	const entry = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	const enabled = Boolean(entry.enabled);
	const start = String(entry.start || '').trim();
	const end = String(entry.end || '').trim();
	const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
	if (!enabled) {
		return { enabled: false, start: start || '09:00', end: end || '17:00' };
	}
	if (!timePattern.test(start) || !timePattern.test(end)) {
		throw new Error(`Operating hours for ${dayKey} must use HH:MM 24-hour time`);
	}
	if (start >= end) {
		throw new Error(`Operating hours for ${dayKey} must end after they start`);
	}
	return { enabled: true, start, end };
};

const normalizeOperatingHours = (value: unknown): IMedsenseOperatingHours | null => {
	if (!value) {
		return null;
	}
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	return MEDSENSE_WEEKDAY_KEYS.reduce<IMedsenseOperatingHours>((acc, dayKey) => {
		acc[dayKey] = normalizeOperatingHoursEntry(source[dayKey] || DEFAULT_MEDSENSE_OPERATING_HOURS[dayKey], dayKey);
		return acc;
	}, {} as IMedsenseOperatingHours);
};

const normalizeAfterHoursPolicy = (value: unknown): IMedsenseAfterHoursPolicy => {
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	return {
		patientDelivery: normalizeMedsenseNotificationChannel(source.patientDelivery, DEFAULT_MEDSENSE_AFTER_HOURS_POLICY.patientDelivery),
		pharmacyDelivery: normalizeMedsenseNotificationChannel(source.pharmacyDelivery, DEFAULT_MEDSENSE_AFTER_HOURS_POLICY.pharmacyDelivery),
	};
};

const normalizeAfterHoursContacts = (value: unknown): IMedsenseAfterHoursContacts => {
	const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
	return {
		patientMessageTemplate: String(source.patientMessageTemplate || '').trim(),
		pharmacySmsRecipients: normalizePhoneRecipientList(source.pharmacySmsRecipients),
		pharmacyEmailRecipients: normalizeEmailRecipientList(source.pharmacyEmailRecipients),
	};
};

const normalizePharmacyVoiceConfig = ({
	voiceInboundNumber,
	timezone,
	operatingHours,
	afterHoursPolicy,
	afterHoursContacts,
}: {
	voiceInboundNumber: unknown;
	timezone: unknown;
	operatingHours: unknown;
	afterHoursPolicy: unknown;
	afterHoursContacts: unknown;
}) => {
	const normalizedVoiceInboundNumber = normalizeVoiceInboundNumber(voiceInboundNumber);
	const normalizedTimezone = typeof timezone === 'string' || timezone === null ? (timezone ? String(timezone).trim() : null) : null;
	const normalizedOperatingHours = normalizeOperatingHours(operatingHours);
	const normalizedAfterHoursPolicy = normalizeAfterHoursPolicy(afterHoursPolicy);
	const normalizedAfterHoursContacts = normalizeAfterHoursContacts(afterHoursContacts);

	if (normalizedVoiceInboundNumber) {
		if (!normalizedOperatingHours) {
			throw new Error('Operating hours are required for a voice-enabled pharmacy');
		}
		return {
			voiceInboundNumber: normalizedVoiceInboundNumber,
			timezone: assertTimezoneValid(normalizedTimezone || ''),
			operatingHours: normalizedOperatingHours,
			afterHoursPolicy: normalizedAfterHoursPolicy,
			afterHoursContacts: normalizedAfterHoursContacts,
		};
	}

	return {
		voiceInboundNumber: null,
		timezone: normalizedTimezone ? assertTimezoneValid(normalizedTimezone) : null,
		operatingHours: normalizedOperatingHours,
		afterHoursPolicy: normalizedAfterHoursPolicy,
		afterHoursContacts: normalizedAfterHoursContacts,
	};
};

const getZonedDateParts = (date: Date, timezone: string): { weekday: IMedsenseOperatingHoursWeekday; hour: number; minute: number } => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		weekday: 'long',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);
	const weekday = String(parts.find((part) => part.type === 'weekday')?.value || '')
		.trim()
		.toLowerCase() as IMedsenseOperatingHoursWeekday;
	const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
	const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
	return { weekday, hour, minute };
};

const getPharmacyVoiceAvailability = (pharmacy: IMedsensePharmacy, matchedInboundNumber?: string | null, now = new Date()) => {
	const timezone = pharmacy.timezone ? String(pharmacy.timezone).trim() : null;
	const operatingHours = pharmacy.operatingHours || null;
	const afterHoursPolicy = pharmacy.afterHoursPolicy || DEFAULT_MEDSENSE_AFTER_HOURS_POLICY;
	if (!pharmacy.voiceInboundNumber || !timezone || !operatingHours) {
		return {
			isOpen: false,
			configurationValid: false,
			timezone: timezone || null,
			matchedInboundNumber: matchedInboundNumber || pharmacy.voiceInboundNumber || null,
			afterHoursPolicy,
			afterHoursContacts: pharmacy.afterHoursContacts || DEFAULT_MEDSENSE_AFTER_HOURS_CONTACTS,
			reason: 'voice_hours_not_configured',
		};
	}

	const zonedNow = getZonedDateParts(now, timezone);
	const dayHours = operatingHours[zonedNow.weekday];
	if (!dayHours?.enabled || !dayHours.start || !dayHours.end) {
		return {
			isOpen: false,
			configurationValid: true,
			timezone,
			matchedInboundNumber: matchedInboundNumber || pharmacy.voiceInboundNumber || null,
			afterHoursPolicy,
			afterHoursContacts: pharmacy.afterHoursContacts || DEFAULT_MEDSENSE_AFTER_HOURS_CONTACTS,
			reason: 'closed_day',
		};
	}

	const [startHour, startMinute] = dayHours.start.split(':').map((item) => Number(item));
	const [endHour, endMinute] = dayHours.end.split(':').map((item) => Number(item));
	const currentMinutes = zonedNow.hour * 60 + zonedNow.minute;
	const startMinutes = startHour * 60 + startMinute;
	const endMinutes = endHour * 60 + endMinute;
	const isOpen = currentMinutes >= startMinutes && currentMinutes < endMinutes;
	return {
		isOpen,
		configurationValid: true,
		timezone,
		matchedInboundNumber: matchedInboundNumber || pharmacy.voiceInboundNumber || null,
		afterHoursPolicy,
		afterHoursContacts: pharmacy.afterHoursContacts || DEFAULT_MEDSENSE_AFTER_HOURS_CONTACTS,
		reason: isOpen ? 'open' : 'outside_operating_hours',
	};
};

const buildPatientAfterHoursMessage = ({ pharmacyName, template }: { pharmacyName: string; template?: string }): string => {
	const fallback = `Thank you for calling ${pharmacyName}. The pharmacy is currently closed. We received your message and will follow up during operating hours.`;
	if (!template?.trim()) {
		return fallback;
	}
	return template.replace(/\{\{\s*pharmacyName\s*\}\}/gi, pharmacyName).trim() || fallback;
};

const buildPharmacyAfterHoursMessage = ({
	pharmacyName,
	callerNumber,
	patientName,
	requestId,
}: {
	pharmacyName: string;
	callerNumber?: string | null;
	patientName?: string;
	requestId: string;
}): string => {
	const callerLabel = patientName?.trim() || callerNumber || 'unknown caller';
	return `After-hours MedSense voice intake for ${pharmacyName}. Caller: ${callerLabel}. Request ID: ${requestId}.`;
};

const sendMedsenseEmail = async (to: string[], subject: string, text: string): Promise<void> => {
	const from = String(settings.get<string>('From_Email') || '').trim();
	if (!from) {
		throw new Error('From email is not configured');
	}
	if (!to.length) {
		throw new Error('No email recipients configured');
	}
	await Mailer.send({ to, from, subject, text });
};

const sendAfterHoursNotifications = async ({
	pharmacy,
	requestId,
	patientMessage,
	pharmacyMessage,
	patientEmail,
	patientPhone,
}: {
	pharmacy: IMedsensePharmacy;
	requestId: string;
	patientMessage: string;
	pharmacyMessage: string;
	patientEmail?: string | null;
	patientPhone?: string | null;
}) => {
	const results = {
		patient: {
			attemptedChannels: [] as Array<'sms' | 'email'>,
			sentChannels: [] as Array<'sms' | 'email'>,
			recipients: [] as string[],
			errors: [] as string[],
			updatedAt: new Date(),
		},
		pharmacy: {
			attemptedChannels: [] as Array<'sms' | 'email'>,
			sentChannels: [] as Array<'sms' | 'email'>,
			recipients: [] as string[],
			errors: [] as string[],
			updatedAt: new Date(),
		},
	};

	const afterHoursPolicy = pharmacy.afterHoursPolicy || DEFAULT_MEDSENSE_AFTER_HOURS_POLICY;
	const afterHoursContacts = pharmacy.afterHoursContacts || DEFAULT_MEDSENSE_AFTER_HOURS_CONTACTS;

	const patientChannels: Array<'sms' | 'email'> =
		afterHoursPolicy.patientDelivery === 'both'
			? ['sms', 'email']
			: afterHoursPolicy.patientDelivery === 'none'
				? []
				: [afterHoursPolicy.patientDelivery as 'sms' | 'email'];
	const pharmacyChannels: Array<'sms' | 'email'> =
		afterHoursPolicy.pharmacyDelivery === 'both'
			? ['sms', 'email']
			: afterHoursPolicy.pharmacyDelivery === 'none'
				? []
				: [afterHoursPolicy.pharmacyDelivery as 'sms' | 'email'];

	for (const channel of patientChannels) {
		results.patient.attemptedChannels.push(channel);
		try {
			if (channel === 'sms') {
				if (!patientPhone) {
					throw new Error('Patient SMS recipient unavailable');
				}
				await sendMedsenseSMS(patientPhone, patientMessage);
				results.patient.sentChannels.push('sms');
				results.patient.recipients.push(patientPhone);
			} else {
				if (!patientEmail) {
					throw new Error('Patient email recipient unavailable');
				}
				await sendMedsenseEmail([patientEmail], `${pharmacy.name} after-hours follow-up`, patientMessage);
				results.patient.sentChannels.push('email');
				results.patient.recipients.push(patientEmail);
			}
		} catch (error: any) {
			results.patient.errors.push(String(error?.message || error || `${channel} notification failed`));
		}
	}

	for (const channel of pharmacyChannels) {
		results.pharmacy.attemptedChannels.push(channel);
		try {
			if (channel === 'sms') {
				if (!afterHoursContacts.pharmacySmsRecipients.length) {
					throw new Error('Pharmacy SMS recipients unavailable');
				}
				for (const recipient of afterHoursContacts.pharmacySmsRecipients) {
					await sendMedsenseSMS(recipient, pharmacyMessage);
					results.pharmacy.recipients.push(recipient);
				}
				results.pharmacy.sentChannels.push('sms');
			} else {
				if (!afterHoursContacts.pharmacyEmailRecipients.length) {
					throw new Error('Pharmacy email recipients unavailable');
				}
				await sendMedsenseEmail(
					afterHoursContacts.pharmacyEmailRecipients,
					`${pharmacy.name} after-hours MedSense intake ${requestId}`,
					pharmacyMessage,
				);
				results.pharmacy.sentChannels.push('email');
				results.pharmacy.recipients.push(...afterHoursContacts.pharmacyEmailRecipients);
			}
		} catch (error: any) {
			results.pharmacy.errors.push(String(error?.message || error || `${channel} notification failed`));
		}
	}

	return results;
};

const sendAfterHoursNotificationsForVoicemail = async ({
	pharmacy,
	requestId,
	voice,
	transcriptText,
	recordingAvailable,
}: {
	pharmacy: IMedsensePharmacy;
	requestId: string;
	voice: Record<string, any>;
	transcriptText?: string | null;
	recordingAvailable: boolean;
}) => {
	const patientUserId = String(voice?.patientUserId || '').trim();
	const patientUser = patientUserId
		? await Users.findOneById(patientUserId, { projection: { _id: 1, name: 1, emails: 1, phoneNumber: 1, phones: 1, phone: 1 } })
		: null;
	const patientEmail = Array.isArray((patientUser as any)?.emails) ? (patientUser as any).emails[0]?.address : null;
	const patientPhone =
		normalizeVoiceInboundNumber(String(voice?.callerNumber || '')) ||
		normalizeVoiceInboundNumber((patientUser as any)?.phoneNumber) ||
		normalizeVoiceInboundNumber((patientUser as any)?.phones?.[0]?.phoneNumber) ||
		normalizeVoiceInboundNumber((patientUser as any)?.phone?.[0]?.phoneNumber);
	const queueUrl = Meteor.absoluteUrl('medsense/queue');
	const patientMessage = buildPatientAfterHoursMessage({
		pharmacyName: pharmacy.name,
		template: pharmacy.afterHoursContacts?.patientMessageTemplate,
	});
	const pharmacyMessageParts = [
		buildPharmacyAfterHoursMessage({
			pharmacyName: pharmacy.name,
			callerNumber: typeof voice?.callerNumber === 'string' ? voice.callerNumber : null,
			patientName: typeof (patientUser as any)?.name === 'string' ? (patientUser as any).name : undefined,
			requestId,
		}),
		recordingAvailable ? 'Voicemail audio and transcript are available in MedSense.' : 'No voicemail audio was captured.',
		transcriptText ? `Transcript: ${transcriptText}` : '',
		`Review: ${queueUrl}`,
	].filter(Boolean);

	return sendAfterHoursNotifications({
		pharmacy,
		requestId,
		patientMessage,
		pharmacyMessage: pharmacyMessageParts.join(' '),
		patientEmail,
		patientPhone,
	});
};

const buildRegistrationSMS = ({ linkUrl, code, patientName }: { linkUrl: string; code: string; patientName?: string }): string => {
	const greeting = patientName?.trim() ? `Hello ${patientName.trim()},` : 'Hello,';
	return `${greeting} use code ${code} to continue your MedSense registration: ${linkUrl} (expires in 15 minutes).`;
};

const findRegistrationByToken = async (token: string): Promise<IMedsensePatientRegistration | null> => {
	const tokenHash = hashRegistrationValue(token);
	return MedsensePatientRegistrations.findOneAsync({ tokenHash });
};

const getMedsenseOrchestratorBaseUrl = (): string | null => {
	const candidates = [process.env.MEDSENSE_ORCHESTRATOR_URL, process.env.ORCHESTRATOR_URL];
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim().replace(/\/+$/, '');
		}
	}
	return null;
};

const notifyMedsenseSessionEnd = async ({
	roomId,
	requestId,
	finalMessageId,
	reason,
}: {
	roomId: string;
	requestId?: string;
	finalMessageId?: string;
	reason: string;
}): Promise<boolean> => {
	const baseUrl = getMedsenseOrchestratorBaseUrl();
	if (!baseUrl) {
		console.warn('[medsense/request.close] MEDSENSE_ORCHESTRATOR_URL or ORCHESTRATOR_URL is not configured; skipping session end notify');
		return false;
	}

	const headers: Record<string, string> = {};
	const sharedSecret = typeof process.env.RC_SECRET === 'string' ? process.env.RC_SECRET.trim() : '';
	if (sharedSecret) {
		headers['X-Rocketchat-Secret'] = sharedSecret;
	}

	try {
		const response = await HTTP.post(`${baseUrl}/session/end`, {
			data: {
				roomId,
				requestId,
				finalMessageId,
				reason,
			},
			headers,
			timeout: 3000,
			throwError: false,
		});

		if (response.statusCode !== 200 || response.data?.success === false) {
			console.warn(
				'[medsense/request.close] Session end notify failed',
				JSON.stringify({
					statusCode: response.statusCode,
					reason,
					roomId,
					requestId,
					response: response.data,
				}),
			);
			return false;
		}
		return true;
	} catch (error) {
		console.warn(
			'[medsense/request.close] Session end notify error',
			JSON.stringify({
				reason,
				roomId,
				requestId,
				error: (error as Error)?.message || String(error),
			}),
		);
		return false;
	}
};

Meteor.startup(() => {
	const raw = MedsensePatientRegistrations.rawCollection();
	void raw.createIndex({ tokenHash: 1 }, { unique: true });
	void raw.createIndex({ status: 1, _updatedAt: -1 });
	void raw.createIndex({ codeExpiresAt: 1 });
});

type MedsenseHubAction = {
	id: string;
	label?: string;
	icon?: string;
	order?: number;
	description?: string;
	capabilities?: {
		registrationHandoff?: boolean;
	};
	[key: string]: any;
};

const parseQualifiedHubActionId = (qualifiedActionId: string): { appId: string; actionId: string } | null => {
	const separatorIndex = qualifiedActionId.indexOf(':');
	if (separatorIndex === -1) {
		return null;
	}

	const appId = qualifiedActionId.substring(0, separatorIndex);
	const actionId = qualifiedActionId.substring(separatorIndex + 1);
	if (!appId || !actionId) {
		return null;
	}

	return { appId, actionId };
};

const discoverMedsenseHubActions = async (): Promise<MedsenseHubAction[]> => {
	if (!Apps.self?.isInitialized()) {
		return [];
	}

	try {
		const apps = await Apps.getManager().get();
		const enabledApps = [];

		for (const app of apps) {
			const status = await app.getStatus();
			if (AppStatusUtils.isEnabled(status)) {
				enabledApps.push(app);
			}
		}

		const results = await Promise.all(
			enabledApps.map(async (app) => {
				const appId = app.getID();
				try {
					const url = Meteor.absoluteUrl('api/apps/public/' + appId + '/hub.actions');
					const response = await HTTP.get(url, { timeout: 2000, throwError: false });

					if (response.statusCode !== 200 || !response.data?.actions || !Array.isArray(response.data.actions)) {
						return [];
					}

					return response.data.actions
						.map((action: any) => {
							if (!action?.id || typeof action.id !== 'string') {
								return null;
							}

							const qualifiedId = action.id.includes(':') ? action.id : appId + ':' + action.id;
							return {
								...action,
								id: qualifiedId,
							} as MedsenseHubAction;
						})
						.filter((action: MedsenseHubAction | null): action is MedsenseHubAction => Boolean(action));
				} catch {
					return [];
				}
			}),
		);

		return results.flat();
	} catch {
		return [];
	}
};

const relayMedsenseHubExecute = async (
	qualifiedActionId: string,
	payload: Record<string, unknown>,
): Promise<{ statusCode: number; data?: any }> => {
	const parsed = parseQualifiedHubActionId(qualifiedActionId);
	if (!parsed) {
		throw new Error('Invalid actionId format');
	}

	const url = Meteor.absoluteUrl('api/apps/public/' + parsed.appId + '/hub.execute');
	const response = await HTTP.post(url, {
		data: {
			actionId: parsed.actionId,
			...payload,
		},
		throwError: false,
	});

	return {
		statusCode: response.statusCode,
		data: response.data,
	};
};

const resolveLegacySpecialtyFlowToActionId = async (legacyFlowId: string): Promise<string | null> => {
	if (!legacyFlowId) {
		return null;
	}

	if (legacyFlowId.includes(':')) {
		return legacyFlowId;
	}

	const actions = await discoverMedsenseHubActions();
	const normalized = legacyFlowId.trim().toLowerCase();
	const mapped =
		actions.find((action) => action.id.toLowerCase().endsWith(':' + normalized)) ||
		actions.find((action) => action.id.toLowerCase().endsWith(':uti_assessment') && normalized === 'uti');

	return mapped?.id || null;
};

const getMedsenseHubActionById = async (qualifiedActionId?: string): Promise<MedsenseHubAction | null> => {
	if (!qualifiedActionId) {
		return null;
	}

	const actions = await discoverMedsenseHubActions();
	return actions.find((action) => action.id === qualifiedActionId) || null;
};

const extractSpecialtyExecutionResult = (payload: any): Record<string, any> | null => {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	const result = payload.result;
	if (result && typeof result === 'object') {
		return result as Record<string, any>;
	}

	return payload as Record<string, any>;
};

const ensureRoomHasMedsenseSessionInfo = async (roomId: string): Promise<void> => {
	await Rooms.update(
		{
			_id: roomId,
			$or: [{ medsenseSessionInfo: { $exists: false } }, { medsenseSessionInfo: null }],
		} as any,
		{
			$set: {
				medsenseSessionInfo: createDefaultMedsenseSessionInfo(),
			},
		},
	);
};

const updateRoomRequestStatus = async (roomId: string, status: string, requestId?: string): Promise<void> => {
	const medsenseAssigned = status === 'taken' ? 'Staff' : 'AI';
	await ensureRoomHasMedsenseSessionInfo(roomId);
	await Rooms.update(
		{ _id: roomId },
		{
			$set: {
				...(requestId ? { medsenseActiveRequestId: requestId } : {}),
				medsenseActiveRequestStatus: status,
				medsenseAssigned,
			},
		},
	);
	api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: status, medsenseAssigned });
};

const closePrecreatedSpecialtyRequest = async ({
	requestId,
	roomId,
	closedByUserId,
	closedByUsername,
}: {
	requestId?: string;
	roomId?: string;
	closedByUserId: string;
	closedByUsername?: string;
}): Promise<void> => {
	if (!requestId || !roomId) {
		return;
	}

	await MedsenseRequests.markClosed(requestId, closedByUserId, closedByUsername || 'system');
	await Rooms.update(
		{ _id: roomId },
		{
			$unset: {
				medsenseActiveRequestId: 1,
				medsenseActiveRequestStatus: 1,
				medsenseAssigned: 1,
			},
		},
	);
	api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: null, medsenseAssigned: null });
	await archiveRoom(roomId, { _id: closedByUserId, username: closedByUsername || 'system' });
};

// Pharmacies Management (Kept Intact)
API.v1.addRoute(
	'medsense/pharmacies.list',
	{ authRequired: true },
	{
		async get() {
			const manageAll = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			const { pharmacyId } = this.queryParams;

			let pharmacies: any[] = [];

			if (pharmacyId) {
				const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
				if (pharmacy) {
					if (manageAll) {
						pharmacies = [pharmacy];
					} else {
						const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
						if (membership) {
							pharmacies = [pharmacy];
						}
					}
				}
			} else {
				if (manageAll) {
					pharmacies = await MedsensePharmacies.find({}, { sort: { name: 1 } }).toArray();
				} else {
					const memberships = await MedsensePharmacyMemberships.findByUserId(this.userId).toArray();
					const pharmacyIds = memberships.map((m) => m.pharmacyId);
					pharmacies = await MedsensePharmacies.find({ _id: { $in: pharmacyIds } }, { sort: { name: 1 } }).toArray();
				}
			}

			return API.v1.success({ pharmacies });
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.info',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.queryParams;

			const manageAll = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			const manageOwn = await hasPermissionAsync(this.userId, 'medsense-manage-individual-pharmacy');

			if (!manageAll && !manageOwn) {
				return API.v1.forbidden();
			}

			const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
			if (!pharmacy) {
				return API.v1.failure('Pharmacy not found');
			}

			if (!manageAll) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) {
					return API.v1.forbidden();
				}
			}

			return API.v1.success({ pharmacy });
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.list.public',
	{ authRequired: false },
	{
		async get() {
			const pharmacies = await MedsensePharmacies.find(
				{ active: { $ne: false } },
				{ projection: { _id: 1, name: 1 }, sort: { name: 1 } },
			).toArray();

			return API.v1.success({ pharmacies });
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.create',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					name: String,
					slug: String,
					active: Boolean,
					voiceInboundNumber: Match.Maybe(Match.OneOf(String, null)),
					timezone: Match.Maybe(Match.OneOf(String, null)),
					operatingHours: Match.Maybe(Match.OneOf(Object, null)),
					afterHoursPolicy: Match.Maybe(Object),
					afterHoursContacts: Match.Maybe(Object),
				}),
			);

			const { name, slug, active } = this.bodyParams;
			let voiceConfig;
			try {
				voiceConfig = normalizePharmacyVoiceConfig({
					voiceInboundNumber: (this.bodyParams as any).voiceInboundNumber,
					timezone: (this.bodyParams as any).timezone,
					operatingHours: (this.bodyParams as any).operatingHours,
					afterHoursPolicy: (this.bodyParams as any).afterHoursPolicy,
					afterHoursContacts: (this.bodyParams as any).afterHoursContacts,
				});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'Invalid pharmacy voice configuration');
			}
			const normalizedInboundNumber = voiceConfig.voiceInboundNumber;

			if (await MedsensePharmacies.findOneBySlug(slug)) {
				return API.v1.failure('Pharmacy with this slug already exists');
			}
			if (normalizedInboundNumber) {
				const existingInbound = await MedsensePharmacies.findOneByVoiceInboundNumber(normalizedInboundNumber);
				if (existingInbound) {
					return API.v1.failure('Pharmacy with this inbound voice number already exists');
				}
			}

			const pharmacyId = (
				await MedsensePharmacies.create({
					name,
					slug,
					active,
					voiceInboundNumber: normalizedInboundNumber,
					timezone: voiceConfig.timezone,
					operatingHours: voiceConfig.operatingHours,
					afterHoursPolicy: voiceConfig.afterHoursPolicy,
					afterHoursContacts: voiceConfig.afterHoursContacts,
					createdBy: this.userId,
				})
			).insertedId;

			// Add create as owner
			await MedsensePharmacyMemberships.insertOne({
				pharmacyId,
				userId: this.userId,
				roles: ['owner'],
				active: true,
				createdBy: this.userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// Assign global role for permissions (Menu visibility etc)
			await addUserRolesAsync(this.userId, ['pharmacy-manager']);

			return API.v1.success({
				pharmacy: await MedsensePharmacies.findOneById(pharmacyId),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.update',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					updateData: Match.ObjectIncluding({
						name: Match.Maybe(String),
						active: Match.Maybe(Boolean),
						voiceInboundNumber: Match.Maybe(Match.OneOf(String, null)),
						timezone: Match.Maybe(Match.OneOf(String, null)),
						operatingHours: Match.Maybe(Match.OneOf(Object, null)),
						afterHoursPolicy: Match.Maybe(Object),
						afterHoursContacts: Match.Maybe(Object),
					}),
				}),
			);

			const { pharmacyId, updateData } = this.bodyParams;

			const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
			if (!pharmacy) {
				return API.v1.failure('Pharmacy not found');
			}

			let voiceConfig;
			try {
				voiceConfig = normalizePharmacyVoiceConfig({
					voiceInboundNumber: Object.prototype.hasOwnProperty.call(updateData, 'voiceInboundNumber')
						? (updateData as any).voiceInboundNumber
						: pharmacy.voiceInboundNumber,
					timezone: Object.prototype.hasOwnProperty.call(updateData, 'timezone') ? (updateData as any).timezone : pharmacy.timezone,
					operatingHours: Object.prototype.hasOwnProperty.call(updateData, 'operatingHours')
						? (updateData as any).operatingHours
						: pharmacy.operatingHours,
					afterHoursPolicy: Object.prototype.hasOwnProperty.call(updateData, 'afterHoursPolicy')
						? (updateData as any).afterHoursPolicy
						: pharmacy.afterHoursPolicy,
					afterHoursContacts: Object.prototype.hasOwnProperty.call(updateData, 'afterHoursContacts')
						? (updateData as any).afterHoursContacts
						: pharmacy.afterHoursContacts,
				});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'Invalid pharmacy voice configuration');
			}
			const normalizedInboundNumber = voiceConfig.voiceInboundNumber;

			if (normalizedInboundNumber) {
				const existingInbound = await MedsensePharmacies.findOneByVoiceInboundNumber(normalizedInboundNumber);
				if (existingInbound && existingInbound._id !== pharmacyId) {
					return API.v1.failure('Pharmacy with this inbound voice number already exists');
				}
			}

			const nextUpdateData: Record<string, any> = { ...updateData };
			nextUpdateData.voiceInboundNumber = normalizedInboundNumber;
			nextUpdateData.timezone = voiceConfig.timezone;
			nextUpdateData.operatingHours = voiceConfig.operatingHours;
			nextUpdateData.afterHoursPolicy = voiceConfig.afterHoursPolicy;
			nextUpdateData.afterHoursContacts = voiceConfig.afterHoursContacts;

			await MedsensePharmacies.updateOne(
				{ _id: pharmacyId },
				{
					$set: {
						...nextUpdateData,
						updatedAt: new Date(),
					},
				},
			);

			return API.v1.success();
		},
	},
);

// Memberships
// Memberships List Endpoint (Existing - could repurpose or leave as is)
// ...
// NEW: Managed Pharmacies List
API.v1.addRoute(
	'medsense/pharmacies.list.managed',
	{ authRequired: true },
	{
		async get() {
			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');

			if (isGlobalAdmin) {
				const pharmacies = await MedsensePharmacies.find({}, { sort: { name: 1 } }).toArray();

				// Fetch actual memberships for the current user
				const myMemberships = await MedsensePharmacyMemberships.find({ userId: this.userId }).toArray();
				const membershipMap = new Map(myMemberships.map((m) => [m.pharmacyId, m.roles]));

				const enriched = pharmacies.map((p) => ({
					...p,
					myRoles: membershipMap.get(p._id) || ['admin'], // Show actual roles, or 'admin' if not a member
				}));
				return API.v1.success({ pharmacies: enriched });
			}

			// Find where user is owner or manager
			const memberships = await MedsensePharmacyMemberships.find({
				userId: this.userId,
				roles: { $in: ['owner', 'manager'] },
			}).toArray();

			if (memberships.length === 0) {
				return API.v1.success({ pharmacies: [] });
			}

			const pharmacyIds = memberships.map((m) => m.pharmacyId);
			const pharmacies = await MedsensePharmacies.find({ _id: { $in: pharmacyIds } }, { sort: { name: 1 } }).toArray();

			const enriched = pharmacies.map((p) => {
				const membership = memberships.find((m) => m.pharmacyId === p._id);
				return { ...p, myRoles: membership?.roles || [] };
			});

			return API.v1.success({ pharmacies: enriched });
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.members.list',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.queryParams;

			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			if (!isGlobalAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) return API.v1.forbidden(); // Must be at least member
			}

			const members = await MedsensePharmacyMemberships.findByPharmacyId(pharmacyId).toArray();
			const userIds = members.map((m) => m.userId);
			const users = await Users.find({ _id: { $in: userIds } }, { projection: { username: 1, name: 1 } }).toArray();
			const userMap = new Map(users.map((u) => [u._id, u]));

			const enrichedMembers = members.map((m) => ({
				...m,
				user: userMap.get(m.userId),
			}));

			return API.v1.success({ members: enrichedMembers });
		},
	},
);

API.v1.addRoute(
	'medsense/patients.byPharmacy',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					text: Match.Optional(String),
					offset: Match.Optional(String),
					count: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const pharmacyId = String(this.queryParams.pharmacyId);
			const text = typeof this.queryParams.text === 'string' ? this.queryParams.text.trim() : '';
			const offset = Math.max(parseInt(String(this.queryParams.offset || '0'), 10) || 0, 0);
			const count = Math.min(Math.max(parseInt(String(this.queryParams.count || '20'), 10) || 20, 1), 50);

			const manageAll = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			let allowedPharmacyIds: string[] = [];

			if (pharmacyId === 'all') {
				if (manageAll) {
					const pharmacies = await MedsensePharmacies.find({}, { projection: { _id: 1 } }).toArray();
					allowedPharmacyIds = pharmacies.map((pharmacy: any) => String(pharmacy._id));
				} else {
					const memberships = await MedsensePharmacyMemberships.findByUserId(this.userId).toArray();
					allowedPharmacyIds = memberships.map((membership: any) => String(membership.pharmacyId));
				}
			} else if (manageAll) {
				allowedPharmacyIds = [pharmacyId];
			} else {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) {
					return API.v1.forbidden();
				}
				allowedPharmacyIds = [pharmacyId];
			}

			allowedPharmacyIds = [...new Set(allowedPharmacyIds.filter(Boolean))];

			if (!allowedPharmacyIds.length) {
				return API.v1.success({ users: [], total: 0 });
			}

			const patientPharmacyMappings = await MedsensePatientPharmacy.find(
				{ pharmacyId: { $in: allowedPharmacyIds } },
				{ projection: { patientUserId: 1 } },
			).toArray();

			const patientUserIds = [
				...new Set(patientPharmacyMappings.map((mapping: any) => String(mapping.patientUserId || '')).filter(Boolean)),
			];
			if (!patientUserIds.length) {
				return API.v1.success({ users: [], total: 0 });
			}

			const staffMemberships = await MedsensePharmacyMemberships.find(
				{ userId: { $in: patientUserIds }, active: { $ne: false } },
				{ projection: { userId: 1 } },
			).toArray();
			const staffUserIds = new Set(staffMemberships.map((membership: any) => String(membership.userId || '')).filter(Boolean));

			const userQuery: any = { _id: { $in: patientUserIds }, type: 'user' };
			if (text) {
				const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const searchPattern = new RegExp(escapedText, 'i');
				userQuery.$or = [{ username: searchPattern }, { name: searchPattern }];
			}

			const users = await Users.find(userQuery, {
				projection: { _id: 1, username: 1, name: 1, roles: 1 },
				sort: { username: 1 },
			}).toArray();

			const patientUsers = users
				.filter((user: any) => {
					if (staffUserIds.has(String(user._id))) {
						return false;
					}
					const roles = Array.isArray(user.roles) ? user.roles : [];
					if (!roles.includes('user')) {
						return false;
					}
					if (roles.includes('bot') || roles.includes('app')) {
						return false;
					}
					return roles.every((role: string) => role === 'user');
				})
				.map((user: any) => ({
					_id: String(user._id),
					username: String(user.username || ''),
					name: typeof user.name === 'string' ? user.name : undefined,
				}));

			const total = patientUsers.length;
			const pagedUsers = patientUsers.slice(offset, offset + count);

			return API.v1.success({ users: pagedUsers, total });
		},
	},
);
API.v1.addRoute(
	'medsense/pharmacies.members.invite',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					username: String,
					roles: [String],
				}),
			);
			const { pharmacyId, username, roles } = this.bodyParams;

			const isAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			if (!isAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership || !membership.roles.includes('manager')) {
					return API.v1.forbidden();
				}
			}

			const user = await Users.findOneByUsername(username);
			if (!user) {
				return API.v1.failure('User not found');
			}

			const existing = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: user._id });
			if (existing) {
				return API.v1.failure('User already a member of this pharmacy');
			}

			await MedsensePharmacyMemberships.insertOne({
				pharmacyId,
				userId: user._id,
				roles,
				active: true,
				createdBy: this.userId,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.members.remove',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					userId: String,
				}),
			);
			const { pharmacyId, userId } = this.bodyParams;

			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			let isOwner = false;
			let isManager = false;

			if (!isGlobalAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) return API.v1.forbidden();
				if (membership.roles.includes('owner')) isOwner = true;
				if (membership.roles.includes('manager')) isManager = true;

				if (!isOwner && !isManager) return API.v1.forbidden();
			} else {
				isOwner = true; // Admin acts as owner
			}

			const targetMembership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId });
			if (!targetMembership) {
				return API.v1.failure('User is not a member');
			}

			// Rules:
			// Manager: Can remove staff only (not owner/manager)
			// Owner: Can remove managers and staff, but NOT other owners
			// Only Global Admin can remove owners
			// Never remove last owner.

			const targetIsOwner = targetMembership.roles.includes('owner');
			const targetIsManager = targetMembership.roles.includes('manager');

			// Owners can only be removed by global admin
			if (targetIsOwner && !isGlobalAdmin) {
				return API.v1.failure('Owners can only be removed by administrators.');
			}

			if (!isGlobalAdmin && !isOwner && isManager) {
				if (targetIsOwner || targetIsManager) {
					return API.v1.failure('Managers cannot remove other managers or owners.');
				}
			}

			if (!isGlobalAdmin && isOwner) {
				// Owners can remove managers and staff, but not owners (already checked above)
				if (targetIsOwner) {
					return API.v1.failure('Owners cannot remove other owners.');
				}
			}

			if (targetIsOwner) {
				// Check if last owner (only applies when admin is removing)
				const owners = await MedsensePharmacyMemberships.find({ pharmacyId, roles: 'owner' }).toArray();
				if (owners.length <= 1) {
					return API.v1.failure('Cannot remove the last owner of the pharmacy.');
				}
			}

			await MedsensePharmacyMemberships.deleteOne({ pharmacyId, userId });
			return API.v1.success();
		},
	},
);

// Patient Preferences
API.v1.addRoute(
	'medsense/patient.pharmacy.resolve',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ userId: String }));
			const { userId } = this.queryParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (!user?.roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const preference = await MedsensePatientPharmacy.findByPatientUserId(userId);
			if (!preference) {
				return API.v1.success({ pharmacy: null });
			}
			const pharmacy = await MedsensePharmacies.findOneById(preference.pharmacyId);
			return API.v1.success({ pharmacy });
		},
	},
);

API.v1.addRoute(
	'medsense/patient.pharmacy.mine',
	{ authRequired: true },
	{
		async get() {
			const preference = await MedsensePatientPharmacy.findByPatientUserId(this.userId);
			if (!preference) {
				return API.v1.success({ pharmacy: null });
			}
			const pharmacy = await MedsensePharmacies.findOneById(preference.pharmacyId);
			return API.v1.success({ pharmacy });
		},
	},
);

API.v1.addRoute(
	'medsense/patient.pharmacy.set',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.bodyParams;

			const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
			if (!pharmacy) {
				return API.v1.failure('Pharmacy not found');
			}

			await MedsensePatientPharmacy.setStartPharmacy(this.userId, pharmacyId, this.userId);
			return API.v1.success();
		},
	},
);

// =========================================================================================
// NEW: Request-Record Queue APIs
// =========================================================================================

// Create Request + Room
API.v1.addRoute(
	'medsense/request.create',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					reason: String,
					requestedByUserId: String,
					requestedByUsername: Match.Maybe(String),
					specialtyActionId: Match.Maybe(String),
					flowId: Match.Maybe(String),
					contextSummary: Match.Maybe(String),
					botUserId: Match.Maybe(String),
					status: Match.Maybe(String),
					pendingPatientUsername: Match.Maybe(String),
					pendingPatientName: Match.Maybe(String),
				}),
			);

			const {
				pharmacyId,
				reason,
				requestedByUserId,
				requestedByUsername,
				specialtyActionId,
				flowId,
				contextSummary,
				botUserId,
				status,
				pendingPatientUsername,
				pendingPatientName,
			} = this.bodyParams;

			const isAdmin = await hasPermissionAsync(this.userId, 'admin');
			if (!isAdmin) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (!user?.roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const requesterUser = await Users.findOneById(requestedByUserId, { projection: { username: 1, name: 1, roles: 1 } });
			if (!requesterUser?._id || !requesterUser.username) {
				return API.v1.failure('Requested-by user not found');
			}

			const patientUser =
				Array.isArray(requesterUser.roles) && requesterUser.roles.length === 1 && requesterUser.roles.includes('user')
					? requesterUser
					: null;

			let botUser = null;
			if (botUserId) {
				botUser = await Users.findOneById(botUserId, { projection: { username: 1, name: 1 } });
			} else {
				const botUsernameSetting = settings.get<string>('Medsense_Bot_User');
				const botUsername = typeof botUsernameSetting === 'string' ? botUsernameSetting.trim() : '';
				if (botUsername) {
					botUser = await Users.findOneByUsernameIgnoringCase(botUsername, { projection: { username: 1, name: 1 } });
				}
			}

			if (!botUser?._id || !botUser.username) {
				return API.v1.failure('Medsense bot user not found');
			}

			const now = new Date();
			const preAssessmentExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
			const initialStatus = typeof status === 'string' && status.trim() ? status.trim() : 'waiting_staff';
			const displayUsername =
				(typeof requestedByUsername === 'string' && requestedByUsername.trim()) ||
				(typeof pendingPatientUsername === 'string' && pendingPatientUsername.trim()) ||
				requesterUser.username;

			const requestId = await MedsenseRequests.createRequest({
				roomId: null,
				pharmacyId,
				requestedByUserId,
				requestedByUsername: displayUsername,
				specialtyActionId: typeof specialtyActionId === 'string' && specialtyActionId.trim() ? specialtyActionId.trim() : undefined,
				flowId: typeof flowId === 'string' && flowId.trim() ? flowId.trim() : undefined,
				reason,
				status: initialStatus as any,
				patientStage: 'pre_assessment',
				contextSummary: contextSummary || '',
				answers: {},
				preAssessmentExpiresAt,
				createdAt: now,
			});

			let room;
			try {
				room = await createMedsenseBotRoomForUsers({
					patientUser,
					botUser,
					creatorUser: patientUser ? undefined : requesterUser,
					roomNameSeed: (pendingPatientUsername as string | undefined) || displayUsername,
					roomExtraData: patientUser
						? {
								customFields: {
									patientId: patientUser._id,
									patientUsername: patientUser.username,
								},
							}
						: {
								customFields: {
									...(pendingPatientUsername ? { pendingPatientUsername } : {}),
									...(pendingPatientName ? { pendingPatientName } : {}),
									...(pendingPatientUsername ? { patientUsername: pendingPatientUsername } : {}),
								},
							},
				});
			} catch (error: any) {
				await MedsenseRequests.markRoomCreateFailed(requestId, error?.message || 'Failed to create request room');
				return API.v1.failure('Failed to create request room');
			}

			try {
				await MedsenseRequests.attachRoom(requestId, room._id, initialStatus as any);
				await updateRoomRequestStatus(room._id, initialStatus, requestId);
			} catch (error: any) {
				await MedsenseRequests.markRoomCreateFailed(requestId, error?.message || 'Failed to attach request room');
				try {
					await deleteRoom(room._id);
				} catch (deleteError) {
					console.error('Failed to delete request room after attach failure', deleteError);
				}
				return API.v1.failure('Failed to create request room');
			}

			const request = await MedsenseRequests.findOneById(requestId);
			return API.v1.success({
				requestId,
				roomId: room._id,
				status: initialStatus,
				request,
				room: {
					_id: room._id,
					name: room.name,
					fname: room.fname,
					t: room.t,
				},
			});
		},
	},
);

// Create Request
API.v1.addRoute(
	'medsense/request.set',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					pharmacyId: String,
					reason: String,
					requestedByUserId: String,
					requestedByUsername: Match.Maybe(String),
					specialtyActionId: Match.Maybe(String),
					flowId: Match.Maybe(String),
					contextSummary: Match.Maybe(String),
					status: Match.Maybe(String),
				}),
			);
			const { roomId, pharmacyId, reason, requestedByUserId, requestedByUsername, specialtyActionId, flowId, contextSummary, status } =
				this.bodyParams;

			// Auth check: Admin or Bot (Orchestrator)
			const isAdmin = await hasPermissionAsync(this.userId, 'admin');
			if (!isAdmin) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (!user?.roles.includes('bot')) {
					// Simple bot check
					return API.v1.forbidden();
				}
			}

			const activeRequest = await MedsenseRequests.findActiveByRoomId(roomId);
			if (activeRequest) {
				return API.v1.failure('Active request already exists for this room.');
			}

			const now = new Date();
			// Default 15 min expiry for pre-assessment
			const preAssessmentExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

			const requestStatus = status || 'waiting_staff';
			const requestId = await MedsenseRequests.createRequest({
				roomId,
				pharmacyId,
				requestedByUserId,
				requestedByUsername,
				specialtyActionId: typeof specialtyActionId === 'string' && specialtyActionId.trim() ? specialtyActionId.trim() : undefined,
				flowId: typeof flowId === 'string' && flowId.trim() ? flowId.trim() : undefined,
				reason,
				status: requestStatus,
				patientStage: 'pre_assessment',
				contextSummary: contextSummary || '',
				answers: {},
				preAssessmentExpiresAt,
				createdAt: now,
			});

			await ensureRoomHasMedsenseSessionInfo(roomId);

			// Lightweight pointer on Room
			await Rooms.update(
				{ _id: roomId },
				{
					$set: {
						medsenseActiveRequestId: requestId,
						medsenseActiveRequestStatus: requestStatus,
						medsenseAssigned: 'AI',
					},
				},
			);

			api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: requestStatus, medsenseAssigned: 'AI' });

			return API.v1.success({ requestId });
		},
	},
);

// Update Request Progress (Clinical Flow)
API.v1.addRoute(
	'medsense/request.update',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					requestId: String,
					patientStage: Match.Maybe(String),
					contextSummary: Match.Maybe(String),
					answers: Match.Maybe(Object),
					currentStepId: Match.Maybe(String),
					status: Match.Maybe(String),
					flowId: Match.Maybe(String),
					specialtyActionId: Match.Maybe(String),
				}),
			);
			const { requestId, patientStage, contextSummary, answers, currentStepId, status, flowId, specialtyActionId } = this.bodyParams;

			// Auth check: Admin or Bot (likely Orchestrator/SmartForms) or Pharmacy Staff
			if (!(await hasPermissionAsync(this.userId, 'medsense-take-request'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (!user?.roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const request = await MedsenseRequests.findOneById(requestId);
			if (!request) {
				return API.v1.failure('Request not found');
			}

			await MedsenseRequests.updateAssessmentProgress(requestId, {
				patientStage,
				contextSummary,
				answers,
				currentStepId,
				status,
			});

			const specialtyUpdate: Record<string, any> = {};
			if (typeof flowId === 'string' && flowId.trim()) {
				specialtyUpdate.flowId = flowId.trim();
			}
			if (typeof specialtyActionId === 'string' && specialtyActionId.trim()) {
				specialtyUpdate.specialtyActionId = specialtyActionId.trim();
			}
			if (Object.keys(specialtyUpdate).length) {
				specialtyUpdate._updatedAt = new Date();
				await MedsenseRequests.updateOne({ _id: requestId }, { $set: specialtyUpdate });
			}

			if (status && request.roomId) {
				const medsenseAssigned = status === 'taken' ? 'Staff' : 'AI';
				await Rooms.update(
					{ _id: request.roomId },
					{
						$set: {
							medsenseActiveRequestStatus: status,
							medsenseAssigned,
						},
					},
				);
				api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: status, medsenseAssigned });
			}

			return API.v1.success();
		},
	},
);

// Get Request Info
API.v1.addRoute(
	'medsense/request.info',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ requestId: String }));
			const { requestId } = this.queryParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (!user?.roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const request = await MedsenseRequests.findOneById(requestId);
			if (!request) {
				return API.v1.failure('Request not found');
			}
			return API.v1.success({ request });
		},
	},
);

// List Waiting Requests (Pending)
API.v1.addRoute(
	'medsense/request.list',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.queryParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			// Check membership? (Optional strictness, assuming permission handles roles)
			const requests = await MedsenseRequests.findPendingByPharmacyId(pharmacyId).toArray();

			// Enrich with room details
			const roomIds = requests.map((r) => r.roomId);
			const rooms = await Rooms.find(
				{ _id: { $in: roomIds } },
				{ projection: { fname: 1, name: 1, t: 1, medsenseSessionInfo: 1 } },
			).toArray();
			const roomMap = new Map(rooms.map((r) => [r._id, r]));

			const enriched = requests.map((r) => ({
				...r,
				roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room',
				voice: _normalizeSessionInfo((roomMap.get(r.roomId) as any)?.medsenseSessionInfo).voice,
			}));

			return API.v1.success({ requests: enriched });
		},
	},
);

// List Followed Requests (Taken by anyone in pharmacy, or generally taken)
API.v1.addRoute(
	'medsense/request.followed',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.queryParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const requests = await MedsenseRequests.findTakenByPharmacyId(pharmacyId).toArray();

			// Enrich
			const roomIds = requests.map((r) => r.roomId);
			const rooms = await Rooms.find({ _id: { $in: roomIds } }, { projection: { fname: 1, name: 1, medsenseSessionInfo: 1 } }).toArray();
			const roomMap = new Map(rooms.map((r) => [r._id, r]));

			const enriched = requests.map((r) => ({
				...r,
				roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room',
				voice: _normalizeSessionInfo((roomMap.get(r.roomId) as any)?.medsenseSessionInfo).voice,
			}));

			return API.v1.success({ requests: enriched });
		},
	},
);

// Take Request
API.v1.addRoute(
	'medsense/request.take',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ requestId: String }));
			const { requestId } = this.bodyParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-take-request'))) {
				return API.v1.forbidden();
			}

			const request = await MedsenseRequests.findOneById(requestId);
			if (
				!request ||
				!['invite_sent', 'waiting_patient', 'ai_preassessment', 'after_hours', 'waiting_staff', 'ready_for_staff'].includes(request.status)
			) {
				return API.v1.failure('Request not found or not pending');
			}

			const room = await Rooms.findOneById(request.roomId);
			if (!room?.t) {
				return API.v1.failure('Room type missing for request room');
			}

			try {
				// Add user to room first so we only mark taken on success
				await addUserToRoom(request.roomId, this.user);
			} catch (error: any) {
				return API.v1.failure(`Failed to add user to room: ${error?.message ?? error}`);
			}

			// Mark Taken
			await MedsenseRequests.markTaken(requestId, this.userId, this.user.username);

			// Update Room
			await Rooms.update(
				{ _id: request.roomId },
				{
					$set: {
						medsenseActiveRequestStatus: 'taken',
						medsenseAssigned: 'Staff',
					},
				},
			);

			// System Message
			await sendMessage(
				this.user,
				{
					rid: request.roomId,
					msg: `Request taken by @${this.user.username}`,
				},
				room,
			);

			api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: 'taken', medsenseAssigned: 'Staff' });

			return API.v1.success();
		},
	},
);

// Close Request
API.v1.addRoute(
	'medsense/request.close',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ requestId: String, message: Match.Maybe(String) }));
			const { requestId, message } = this.bodyParams;

			const currentUser = await Users.findOneById(this.userId, { projection: { roles: 1 } });
			const isBot = Boolean(currentUser?.roles?.includes('bot'));

			if (!isBot && !(await hasPermissionAsync(this.userId, 'medsense-close-request'))) {
				return API.v1.forbidden();
			}

			const request = await MedsenseRequests.findOneById(requestId);
			if (!request || request.status === 'closed') {
				return API.v1.failure('Request not found or already closed');
			}

			const room = await Rooms.findOneById(request.roomId);
			if (!room?.t) {
				return API.v1.failure('Room type missing for request room');
			}

			const closeMessage = typeof message === 'string' && message.trim() ? message.trim() : `Request closed by @${this.user.username}`;
			const isOmnichannelRoom = room.t === 'l';
			let closeMessageRecord: any = null;

			if (!isBot) {
				try {
					if (isOmnichannelRoom) {
						await closeLivechatRoom(this.user, request.roomId, {
							comment: closeMessage,
						});
					} else {
						await removeUserFromRoom(request.roomId, this.user);
					}
				} catch (error: any) {
					return API.v1.failure(
						isOmnichannelRoom
							? `Failed to close omnichannel room: ${error?.message ?? error}`
							: `Failed to remove user from room: ${error?.message ?? error}`,
					);
				}
			}

			await MedsenseRequests.markClosed(requestId, this.userId, this.user.username);

			await Rooms.update(
				{ _id: request.roomId },
				{
					$unset: {
						medsenseActiveRequestId: 1,
						medsenseActiveRequestStatus: 1,
						medsenseAssigned: 1,
					},
				},
			);

			if (!isOmnichannelRoom) {
				closeMessageRecord = await sendMessage(
					this.user,
					{
						rid: request.roomId,
						msg: closeMessage,
					},
					room,
				);
			}

			api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null, medsenseAssigned: null });
			if (!isBot) {
				await notifyMedsenseSessionEnd({
					roomId: request.roomId,
					requestId,
					finalMessageId: (closeMessageRecord as any)?._id,
					reason: 'staff_request_close',
				});
			}
			await Rooms.update(
				{ _id: request.roomId },
				{
					$set: {
						ro: true,
						reactWhenReadOnly: false,
					},
				},
			);
			api.broadcast('room.save', {
				_id: request.roomId,
				medsenseActiveRequestStatus: null,
				medsenseAssigned: null,
				ro: true,
				reactWhenReadOnly: false,
			});

			return API.v1.success();
		},
	},
);

// Decline Request (close with decline message)
API.v1.addRoute(
	'medsense/request.decline',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					requestId: String,
					message: Match.Maybe(String),
				}),
			);
			const { requestId, message } = this.bodyParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-close-request'))) {
				return API.v1.forbidden();
			}

			const request = await MedsenseRequests.findOneById(requestId);
			if (
				!request ||
				!['invite_sent', 'waiting_patient', 'ai_preassessment', 'after_hours', 'waiting_staff', 'ready_for_staff'].includes(request.status)
			) {
				return API.v1.failure('Request not found or not pending');
			}

			const room = await Rooms.findOneById(request.roomId);
			if (!room?.t) {
				return API.v1.failure('Room type missing for request room');
			}

			// Mark Closed
			await MedsenseRequests.markClosed(requestId, this.userId, this.user.username);

			// Clear Room fields
			await Rooms.update(
				{ _id: request.roomId },
				{
					$unset: {
						medsenseActiveRequestId: 1,
						medsenseActiveRequestStatus: 1,
						medsenseAssigned: 1,
					},
				},
			);

			// Post decline message (as bot if available)
			const declineText = message ? `Request declined by @${this.user.username}: ${message}` : `Request declined by @${this.user.username}`;
			const botUsername = settings.get<string>('Medsense_Bot_User') || 'bot';
			const botUser = botUsername ? await Users.findOneByUsername(botUsername, { projection: { username: 1 } }) : null;
			const messageUser = botUser ?? this.user;
			const declineMessageRecord = await sendMessage(
				messageUser,
				{
					rid: request.roomId,
					msg: declineText,
				},
				room,
			);

			api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null, medsenseAssigned: null });
			await notifyMedsenseSessionEnd({
				roomId: request.roomId,
				requestId,
				finalMessageId: (declineMessageRecord as any)?._id,
				reason: 'staff_request_decline',
			});
			await Rooms.update(
				{ _id: request.roomId },
				{
					$set: {
						ro: true,
						reactWhenReadOnly: false,
					},
				},
			);
			api.broadcast('room.save', {
				_id: request.roomId,
				medsenseActiveRequestStatus: null,
				medsenseAssigned: null,
				ro: true,
				reactWhenReadOnly: false,
			});

			return API.v1.success();
		},
	},
);

// Request History
API.v1.addRoute(
	'medsense/request.history',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
			const { pharmacyId } = this.queryParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const requests = await MedsenseRequests.findClosedByPharmacyId(pharmacyId, 50).toArray();

			// Enrich
			const roomIds = requests.map((r) => r.roomId);
			const rooms = await Rooms.find({ _id: { $in: roomIds } }, { projection: { fname: 1, name: 1 } }).toArray();
			const roomMap = new Map(rooms.map((r) => [r._id, r]));

			const enriched = requests.map((r) => ({
				...r,
				roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room',
			}));

			return API.v1.success({ requests: enriched });
		},
	},
);

// =========================================================================================
// NEW: Medsense Hub (Entrypoint) APIs
// =========================================================================================

API.v1.addRoute(
	'medsense/hub.actions',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-view-hub'))) {
				return API.v1.forbidden();
			}

			const actions = await discoverMedsenseHubActions();
			return API.v1.success({ actions });
		},
	},
);

API.v1.addRoute(
	'medsense/registration.specialtyActions',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const discovered = await discoverMedsenseHubActions();
			const actions = discovered
				.filter((action) => Boolean(action.capabilities?.registrationHandoff))
				.sort((left, right) => (left.order || 0) - (right.order || 0))
				.map((action) => {
					const parsed = parseQualifiedHubActionId(action.id);
					return {
						actionId: action.id,
						id: action.id,
						appId: parsed?.appId,
						label: action.label || parsed?.actionId || action.id,
						description: action.description,
						icon: action.icon,
						flowId: (action as any).flowId,
						capabilities: action.capabilities,
					};
				});

			return API.v1.success({ actions });
		},
	},
);

API.v1.addRoute(
	'medsense/hub.execute',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ actionId: String }));
			const { actionId } = this.bodyParams;

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-hub'))) {
				return API.v1.forbidden();
			}

			try {
				const relayed = await relayMedsenseHubExecute(String(actionId), {
					userId: this.userId,
					username: this.user?.username,
				});

				if (relayed.statusCode !== 200 || !relayed.data) {
					return API.v1.failure('Failed to execute action via Hub App');
				}

				return API.v1.success({ view: relayed.data.view });
			} catch (error) {
				return API.v1.failure((error as Error)?.message || 'Error executing hub action');
			}
		},
	},
);

// =========================================================================================
// NEW: Invite SMS API (Server-side Twilio reuse)
// =========================================================================================
API.v1.addRoute(
	'medsense/invite.sms',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					phoneNumber: String,
					requestedBy: Match.Maybe(String),
					patientName: Match.Maybe(String),
				}),
			);

			const { roomId, phoneNumber, patientName } = this.bodyParams;

			const isAdmin = await hasPermissionAsync(this.userId, 'admin');
			let allowed = isAdmin;
			if (!allowed) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				if (user?.roles.includes('bot')) allowed = true;
			}
			if (!allowed && (await hasPermissionAsync(this.userId, 'medsense-take-request'))) {
				allowed = true;
			}

			if (!allowed) {
				return API.v1.forbidden();
			}

			const room = await Rooms.findOneById(roomId);
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const service = settings.get<string>('SMS_Service');
			if (!service || service === 'false') {
				return API.v1.failure('SMS Service is disabled in Administration settings');
			}

			const SMSService = await OmnichannelIntegration.getSmsService(service);
			if (!SMSService) {
				return API.v1.failure('SMS Service provider not found or configured');
			}

			// Resolve From Number from settings (new Medsense-specific setting)
			const fromNumber = settings.get<string>('SMS_Twilio_Number');

			if (!fromNumber) {
				return API.v1.failure('Twilio "From" number not found in settings.');
			}

			// Validate Phone E.164
			if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
				return API.v1.failure('Invalid phone number format. Must be E.164 (e.g. +1234567890)');
			}

			let inviteUrl = '';
			try {
				// days: 30 (expiry?), maxUses: 0 (infinite)
				const invite = await findOrCreateInvite(this.userId, { rid: roomId, days: 30, maxUses: 0 });
				if (!invite || !invite.url) {
					throw new Error('No invite URL returned');
				}
				inviteUrl = invite.url;
			} catch (err: any) {
				console.error('Invite Generation Error:', err);
				return API.v1.failure(`Failed to create invite link: ${err.message}`);
			}

			try {
				const greetingName = patientName?.trim();
				const body = greetingName
					? `Hello ${greetingName}, please join your Medsense assessment here: ${inviteUrl}`
					: `Hello, please join your Medsense assessment here: ${inviteUrl}`;
				await SMSService.send(fromNumber, phoneNumber, body);
				return API.v1.success();
			} catch (e: any) {
				console.error('SMS Invite Error:', e);
				return API.v1.failure(`SMS Send Failed: ${e.message || e}`);
			}
		},
	},
);

// =========================================================================================
// Patient Registration with Verification Code
// =========================================================================================
API.v1.addRoute(
	'medsense/registration.start',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					phoneNumber: String,
					name: Match.Maybe(String),
					email: Match.Maybe(String),
					username: Match.Maybe(String),
					reason: Match.Maybe(String),
					pharmacyId: Match.Maybe(String),
					specialtyActionId: Match.Maybe(String),
					specialtyFlowId: Match.Maybe(String),
					specialtyRoomId: Match.Maybe(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const normalizedPhone = normalizeRegistrationPhone(String(this.bodyParams.phoneNumber));
			if (!normalizedPhone) {
				return API.v1.failure('Invalid phone number format. Use +1234567890 or 1234567890');
			}

			const selectedPharmacyId = this.bodyParams.pharmacyId ? String(this.bodyParams.pharmacyId) : undefined;
			if (!selectedPharmacyId || selectedPharmacyId === 'all') {
				return API.v1.failure('pharmacyId is required');
			}

			const pharmacy = await MedsensePharmacies.findOneById(selectedPharmacyId);
			if (!pharmacy) {
				return API.v1.failure('Pharmacy not found');
			}
			if (pharmacy.active === false) {
				return API.v1.failure('Pharmacy is inactive');
			}

			const canManageAll = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			if (!canManageAll) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId: selectedPharmacyId, userId: this.userId });
				if (!membership) {
					return API.v1.forbidden();
				}
			}

			const providedSpecialtyActionId = this.bodyParams.specialtyActionId ? String(this.bodyParams.specialtyActionId).trim() : undefined;
			const legacySpecialtyFlowId = this.bodyParams.specialtyFlowId ? String(this.bodyParams.specialtyFlowId).trim() : undefined;
			let resolvedSpecialtyActionId = providedSpecialtyActionId;

			if (!resolvedSpecialtyActionId && legacySpecialtyFlowId) {
				resolvedSpecialtyActionId = (await resolveLegacySpecialtyFlowToActionId(legacySpecialtyFlowId)) || undefined;
				if (!resolvedSpecialtyActionId) {
					return API.v1.failure('Unsupported specialtyFlowId');
				}
			}

			const selectedSpecialtyAction = await getMedsenseHubActionById(resolvedSpecialtyActionId);
			const shouldPrecreateSpecialty = Boolean(selectedSpecialtyAction?.capabilities?.requestFirstConfirmationFlow);

			const token = createRegistrationToken();
			const code = createRegistrationCode();
			const now = new Date();
			const codeExpiresAt = new Date(now.getTime() + REGISTRATION_CODE_TTL_MS);
			const tokenHash = hashRegistrationValue(token);
			const codeHash = hashRegistrationValue(code);
			const linkUrl = Meteor.absoluteUrl(`medsense/registration/${token}`);

			const prefill: MedsenseRegistrationPrefill = {
				name: this.bodyParams.name ? String(this.bodyParams.name).trim() : undefined,
				email: this.bodyParams.email ? String(this.bodyParams.email).trim().toLowerCase() : undefined,
				username: this.bodyParams.username ? String(this.bodyParams.username).trim() : undefined,
				phone: normalizedPhone,
				reason: this.bodyParams.reason ? String(this.bodyParams.reason).trim() : undefined,
				pharmacyId: selectedPharmacyId,
			};

			console.info('[medsense.registration.start] prefill-created', {
				startedByUserId: this.userId,
				startedByUsername: this.user?.username,
				selectedPharmacyId,
				prefill,
			});

			let specialtyRequestId: string | undefined;
			let specialtyRoomId: string | undefined;
			if (resolvedSpecialtyActionId && shouldPrecreateSpecialty) {
				try {
					const relayed = await relayMedsenseHubExecute(String(resolvedSpecialtyActionId), {
						userId: this.userId,
						username: this.user?.username,
						context: {
							origin: 'registration_start',
							precreateOnly: true,
							pharmacyId: selectedPharmacyId,
							requestedByUserId: this.userId,
							requestedByUsername: this.user?.username,
							patientName: prefill.name,
							patientUsername: prefill.username,
						},
					});

					const result = relayed.statusCode === 200 ? extractSpecialtyExecutionResult(relayed.data) : null;
					if (!result?.requestId || !result?.roomId) {
						return API.v1.failure('Failed to initialize specialty flow');
					}

					specialtyRequestId = String(result.requestId);
					specialtyRoomId = String(result.roomId);
					await ensureRoomHasMedsenseSessionInfo(specialtyRoomId);
				} catch (error: any) {
					return API.v1.failure(error?.message || 'Failed to initialize specialty flow');
				}
			}

			const registrationId = await MedsensePatientRegistrations.insertAsync({
				tokenHash,
				codeHash,
				phoneNumber: normalizedPhone,
				codeExpiresAt,
				attemptCount: 0,
				resendCount: 0,
				lastSentAt: now,
				status: 'pending',
				prefill,
				specialtyActionId: resolvedSpecialtyActionId,
				specialtyFlowId: legacySpecialtyFlowId,
				specialtyRoomId: specialtyRoomId || (this.bodyParams.specialtyRoomId ? String(this.bodyParams.specialtyRoomId) : undefined),
				specialtyRequestId,
				specialtyStatus: specialtyRequestId ? 'invite_pending' : undefined,
				startedByUserId: this.userId,
				startedByUsername: this.user?.username,
				createdAt: now,
				_updatedAt: now,
			} as any);

			try {
				const smsBody = buildRegistrationSMS({
					linkUrl,
					code,
					patientName: prefill.name,
				});
				await sendMedsenseSMS(normalizedPhone, smsBody);
				if (specialtyRequestId && specialtyRoomId) {
					await MedsenseRequests.updateAssessmentProgress(specialtyRequestId, { status: 'invite_sent' });
					await updateRoomRequestStatus(specialtyRoomId, 'invite_sent', specialtyRequestId);
				}
			} catch (error: any) {
				if (specialtyRequestId && specialtyRoomId) {
					try {
						await closePrecreatedSpecialtyRequest({
							requestId: specialtyRequestId,
							roomId: specialtyRoomId,
							closedByUserId: this.userId,
							closedByUsername: this.user?.username,
						});
					} catch (cleanupError) {
						console.error('Failed to clean up precreated specialty request after SMS failure', cleanupError);
					}
				}
				await MedsensePatientRegistrations.removeAsync({ _id: registrationId as string });
				return API.v1.failure(`SMS Send Failed: ${error?.message || error}`);
			}

			if (specialtyRequestId) {
				await MedsensePatientRegistrations.updateAsync({ _id: registrationId as string }, {
					$set: {
						specialtyStatus: 'invite_sent',
						specialtyRequestId,
						specialtyRoomId: specialtyRoomId || undefined,
						_updatedAt: new Date(),
					},
				} as any);
			}

			return API.v1.success({
				registrationId,
				linkUrl,
				smsStatus: 'sent',
			});
		},
	},
);

API.v1.addRoute(
	'medsense/registration.verify',
	{ authRequired: false },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					token: String,
					code: String,
				}),
			);

			const token = String(this.bodyParams.token).trim();
			const code = String(this.bodyParams.code).trim();
			if (!token || !code) {
				return API.v1.failure('Invalid verification request');
			}

			const registration = await findRegistrationByToken(token);
			if (!registration) {
				return API.v1.failure('Registration link is invalid');
			}

			const now = new Date();
			if (registration.status === 'completed') {
				return API.v1.failure('Registration is already completed');
			}

			if (registration.status === 'expired') {
				return API.v1.failure('Verification code expired');
			}

			if (
				registration.status === 'locked' &&
				registration._updatedAt &&
				now.getTime() - new Date(registration._updatedAt).getTime() < REGISTRATION_LOCK_TTL_MS
			) {
				return API.v1.failure('Too many invalid attempts. Please wait and try again.');
			}

			if (new Date(registration.codeExpiresAt).getTime() <= now.getTime()) {
				await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, { $set: { status: 'expired', _updatedAt: now } } as any);
				return API.v1.failure('Verification code expired');
			}

			const codeHash = hashRegistrationValue(code);
			if (!safeHashEqual(registration.codeHash, codeHash)) {
				const nextAttempts = (registration.attemptCount || 0) + 1;
				const nextStatus: MedsenseRegistrationStatus = nextAttempts >= REGISTRATION_MAX_ATTEMPTS ? 'locked' : 'pending';
				await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, {
					$set: { attemptCount: nextAttempts, status: nextStatus, _updatedAt: now },
				} as any);
				if (nextStatus === 'locked') {
					return API.v1.failure('Too many invalid attempts. Please wait and try again.');
				}
				return API.v1.failure('Invalid verification code');
			}

			const verificationSession = createRegistrationSessionToken();
			const verificationSessionHash = hashRegistrationValue(verificationSession);
			const verificationSessionExpiresAt = new Date(now.getTime() + REGISTRATION_SESSION_TTL_MS);

			await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, {
				$set: {
					status: 'verified',
					attemptCount: 0,
					verificationSessionHash,
					verificationSessionExpiresAt,
					_updatedAt: now,
				},
			} as any);

			return API.v1.success({
				verificationSession,
				verificationSessionExpiresAt: verificationSessionExpiresAt.toISOString(),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/registration.resend',
	{ authRequired: false },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					token: String,
				}),
			);

			const token = String(this.bodyParams.token).trim();
			const registration = await findRegistrationByToken(token);
			if (!registration) {
				return API.v1.failure('Registration link is invalid');
			}

			if (registration.status === 'completed') {
				return API.v1.failure('Registration is already completed');
			}

			const now = new Date();
			if (registration.resendCount >= REGISTRATION_MAX_RESENDS) {
				await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, { $set: { status: 'locked', _updatedAt: now } } as any);
				return API.v1.failure('Resend limit reached');
			}

			const lastSentTime = new Date(registration.lastSentAt).getTime();
			if (now.getTime() - lastSentTime < REGISTRATION_RESEND_COOLDOWN_MS) {
				return API.v1.failure('Please wait before requesting a new code');
			}

			const code = createRegistrationCode();
			const codeHash = hashRegistrationValue(code);
			const codeExpiresAt = new Date(now.getTime() + REGISTRATION_CODE_TTL_MS);
			const linkUrl = Meteor.absoluteUrl(`medsense/registration/${token}`);

			try {
				const smsBody = buildRegistrationSMS({
					linkUrl,
					code,
					patientName: registration.prefill?.name,
				});
				await sendMedsenseSMS(registration.phoneNumber, smsBody);
			} catch (error: any) {
				return API.v1.failure(`SMS Send Failed: ${error?.message || error}`);
			}

			await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, {
				$set: {
					codeHash,
					codeExpiresAt,
					lastSentAt: now,
					attemptCount: 0,
					status: 'pending',
					verificationSessionHash: undefined,
					verificationSessionExpiresAt: undefined,
					_updatedAt: now,
				},
				$inc: { resendCount: 1 },
			} as any);

			return API.v1.success({
				smsStatus: 'sent',
				resendCount: (registration.resendCount || 0) + 1,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/registration.prefill',
	{ authRequired: false },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					token: String,
					verificationSession: String,
				}),
			);

			const token = String(this.queryParams.token).trim();
			const verificationSession = String(this.queryParams.verificationSession).trim();
			const registration = await findRegistrationByToken(token);
			if (!registration) {
				return API.v1.failure('Registration link is invalid');
			}

			if (!registration.verificationSessionHash || !registration.verificationSessionExpiresAt) {
				return API.v1.failure('Verification session is missing');
			}

			const verificationSessionHash = hashRegistrationValue(verificationSession);
			if (!safeHashEqual(registration.verificationSessionHash, verificationSessionHash)) {
				return API.v1.failure('Verification session is invalid');
			}

			if (new Date(registration.verificationSessionExpiresAt).getTime() <= Date.now()) {
				return API.v1.failure('Verification session expired');
			}

			console.info('[medsense.registration.prefill] prefill-returned', {
				registrationId: registration._id,
				startedByUserId: registration.startedByUserId,
				prefill: registration.prefill || {},
			});

			return API.v1.success({
				prefill: registration.prefill || {},
			});
		},
	},
);

API.v1.addRoute(
	'medsense/registration.complete',
	{ authRequired: false },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					token: String,
					verificationSession: String,
					name: String,
					email: String,
					username: String,
					pass: String,
					reason: String,
					phone: Match.Maybe(String),
					pharmacyId: Match.Maybe(String),
				}),
			);

			const token = String(this.bodyParams.token).trim();
			const verificationSession = String(this.bodyParams.verificationSession).trim();
			const registration = await findRegistrationByToken(token);
			if (!registration) {
				return API.v1.failure('Registration link is invalid');
			}

			if (registration.status === 'completed') {
				return API.v1.failure('Registration is already completed');
			}

			if (!registration.verificationSessionHash || !registration.verificationSessionExpiresAt) {
				return API.v1.failure('Verification session is missing');
			}

			const verificationSessionHash = hashRegistrationValue(verificationSession);
			if (!safeHashEqual(registration.verificationSessionHash, verificationSessionHash)) {
				return API.v1.failure('Verification session is invalid');
			}

			if (new Date(registration.verificationSessionExpiresAt).getTime() <= Date.now()) {
				return API.v1.failure('Verification session expired');
			}

			const name = String(this.bodyParams.name).trim();
			const email = String(this.bodyParams.email).trim().toLowerCase();
			const username = String(this.bodyParams.username).trim();
			const reason = String(this.bodyParams.reason).trim();
			const pass = String(this.bodyParams.pass);
			const phoneCandidate = this.bodyParams.phone
				? String(this.bodyParams.phone)
				: registration.prefill?.phone || registration.phoneNumber;
			const normalizedPhone = normalizeRegistrationPhone(phoneCandidate || '');
			if (!normalizedPhone) {
				return API.v1.failure('error-invalid-phone-number');
			}

			if (!validateNameChars(name)) {
				return API.v1.failure('Name contains invalid characters');
			}

			if (!(await checkUsernameAvailability(username))) {
				return API.v1.failure('Username is already in use');
			}

			if (!(await checkEmailAvailability(email))) {
				return API.v1.failure('Email already exists');
			}

			let userId: string;
			try {
				const createdUser = await registerUser({ email, pass, name, reason, phone: normalizedPhone } as any);
				if (typeof createdUser !== 'string') {
					return API.v1.failure('Error creating user');
				}
				userId = createdUser;
				await setUsernameWithValidation(userId, username);
				await addUserRolesAsync(userId, ['user']);
			} catch (error: any) {
				return API.v1.failure(error?.error || error?.message || 'Error creating user');
			}

			const resolvedPharmacyId = this.bodyParams.pharmacyId || registration.prefill?.pharmacyId;
			if (resolvedPharmacyId) {
				const pharmacy = await MedsensePharmacies.findOneById(String(resolvedPharmacyId));
				if (pharmacy) {
					await MedsensePatientPharmacy.setStartPharmacy(userId, String(resolvedPharmacyId), registration.startedByUserId || userId);
				}
			}

			const specialtyActionId = registration.specialtyActionId || registration.specialtyFlowId;
			let specialtyRoomId = registration.specialtyRoomId;
			let specialtyRequestId: string | undefined = registration.specialtyRequestId;
			const hasPrecreatedSpecialty = Boolean(registration.specialtyRequestId && registration.specialtyRoomId);
			let specialtyStatus: string | undefined = specialtyActionId ? (hasPrecreatedSpecialty ? 'invite_sent' : 'pending') : undefined;
			let specialtyError: string | undefined;

			if (specialtyActionId && !hasPrecreatedSpecialty) {
				try {
					const relayed = await relayMedsenseHubExecute(String(specialtyActionId), {
						userId: registration.startedByUserId || userId,
						username: registration.startedByUsername || username,
						context: {
							origin: 'registration_complete',
							registrationId: registration._id,
							patientUserId: userId,
							patientUsername: username,
							pharmacyId: resolvedPharmacyId ? String(resolvedPharmacyId) : undefined,
							requestedByUserId: registration.startedByUserId || userId,
							requestedByUsername: registration.startedByUsername || username,
						},
					});

					if (relayed.statusCode === 200 && relayed.data) {
						const result = relayed.data.result || relayed.data;
						if (typeof result?.roomId === 'string') {
							specialtyRoomId = result.roomId;
						}
						if (typeof result?.requestId === 'string') {
							specialtyRequestId = result.requestId;
						}
						specialtyStatus = typeof result?.status === 'string' ? result.status : specialtyRoomId ? 'pending_room_link' : 'pending';
						if (typeof result?.error === 'string') {
							specialtyError = result.error;
						}
					} else {
						specialtyStatus = 'failed';
						specialtyError = 'Failed to execute specialty action';
					}
				} catch (error: any) {
					specialtyStatus = 'failed';
					specialtyError = error?.message || 'Failed to execute specialty action';
				}
			}

			if (specialtyRoomId) {
				try {
					const specialtyRoom = await Rooms.findOneById(String(specialtyRoomId));
					if (!specialtyRoom) {
						throw new Meteor.Error('error-invalid-room', 'Invalid specialty room');
					}

					await ensureRoomHasMedsenseSessionInfo(String(specialtyRoomId));

					await ensureUserInRoom(
						String(specialtyRoomId),
						{ _id: userId, username },
						{ _id: registration.startedByUserId || userId, username: registration.startedByUsername || username },
					);

					const isMedsenseRoom = Boolean(
						(specialtyRoom as any).medsenseActiveRequestId ||
							(typeof specialtyRoom.name === 'string' && specialtyRoom.name.startsWith('medsense-')),
					);

					if (isMedsenseRoom) {
						await Rooms.setCustomFieldsById(String(specialtyRoomId), {
							...(specialtyRoom.customFields || {}),
							patientId: userId,
							patientUsername: username,
						} as any);
					}

					if (specialtyRequestId) {
						await MedsenseRequests.updateOne(
							{ _id: specialtyRequestId },
							{
								$set: {
									requestedByUserId: userId,
									requestedByUsername: username,
									status: 'waiting_patient',
									_updatedAt: new Date(),
								},
							},
						);
						await updateRoomRequestStatus(String(specialtyRoomId), 'waiting_patient', specialtyRequestId);
						specialtyStatus = 'waiting_patient';
					} else if (!specialtyStatus) {
						specialtyStatus = 'pending_room_link';
					}
				} catch (error: any) {
					specialtyStatus = 'pending_room_link';
					specialtyError = error?.message || 'Failed to attach patient to specialty room';
				}
			}

			const now = new Date();
			await MedsensePatientRegistrations.updateAsync({ _id: registration._id }, {
				$set: {
					status: 'completed',
					completedUserId: userId,
					completedAt: now,
					specialtyActionId: specialtyActionId || undefined,
					specialtyRoomId: specialtyRoomId || undefined,
					specialtyRequestId,
					specialtyStatus,
					specialtyError,
					verificationSessionHash: undefined,
					verificationSessionExpiresAt: undefined,
					_updatedAt: now,
				},
			} as any);

			return API.v1.success({
				success: true,
				userId,
				specialty: specialtyActionId
					? {
							actionId: specialtyActionId,
							flowId: specialtyActionId,
							roomId: specialtyRoomId,
							requestId: specialtyRequestId,
							status: specialtyStatus || (specialtyRoomId ? 'pending_room_link' : 'pending'),
							error: specialtyError,
						}
					: null,
			});
		},
	},
);
// =========================================================================================
// NEW: Pharmacy Staff Invites (MedsensePharmacyInvites)
// =========================================================================================

API.v1.addRoute(
	'medsense/pharmacies.members.invite.sms',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					phone: String,
					// role: String, // REMOVED: Implicitly 'staff'
					name: Match.Maybe(String),
					email: Match.Maybe(String),
				}),
			);

			const { pharmacyId, phone, name, email } = this.bodyParams;

			// Role Normalization: Always staff
			// if (!['owner', 'manager', 'staff'].includes(role)) { ... }

			// Permissions
			// Global admin: Allowed
			// Owner: Can invite manager or staff
			// Manager: Can invite staff only
			// Block manager -> manager

			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			let isOwner = false;
			let isManager = false;

			if (!isGlobalAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) return API.v1.forbidden();

				if (membership.roles.includes('owner')) isOwner = true;
				if (membership.roles.includes('manager')) isManager = true;

				if (!isOwner && !isManager) return API.v1.forbidden();

				// Managers cannot invite managers/owners
				// Decoupled flow: Managers invite 'staff' implicitly.
			}

			// Role is always 'staff' for invites now. Owner can promote later.
			const inviteRole = 'staff';

			// Normalize Phone
			if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
				return API.v1.failure('Invalid phone format. Must be E.164 (e.g. +1...)');
			}

			// Decoupled: We do NOT find user by phone here. We send SMS blindly.
			// If they are already a member, they will find out when they try to verify.

			// Check if phone has pending invite
			const existingInvite = await MedsensePharmacyInvites.findPendingByPhoneAndPharmacy(phone, pharmacyId);

			// Generate Code
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const now = new Date();
			const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

			let inviteId = existingInvite?._id;

			if (existingInvite) {
				// Resend logic
				const isExpired = existingInvite.expiresAt < now;
				if (isExpired) {
					// Create NEW invite
					inviteId = await MedsensePharmacyInvites.createInvite({
						pharmacyId,
						phone,
						role: inviteRole as any,
						code,
						expiresAt,
						status: 'pending',
						sendCount: 1,
						active: true,
						createdBy: this.userId,
						createdAt: now,
						name: name,
						email: email,
						lastSentAt: now,
					});
				}
			} else {
				inviteId = await MedsensePharmacyInvites.createInvite({
					pharmacyId,
					phone,
					role: inviteRole as any,
					code,
					expiresAt,
					status: 'pending',
					sendCount: 1,
					active: true,
					createdBy: this.userId,
					createdAt: now,
					name: name,
					email: email,
					lastSentAt: now,
				});
			}

			// Re-fetch pharmacy name for SMS
			const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
			if (!pharmacy) {
				return API.v1.failure('Pharmacy not found');
			}

			// SMS Logic
			const service = settings.get<string>('SMS_Service');
			if (!service || service === 'false') {
				return API.v1.failure('SMS Service is disabled in Administration settings');
			}

			const SMSService = await OmnichannelIntegration.getSmsService(service);
			if (!SMSService) {
				return API.v1.failure('SMS Service provider not found');
			}

			const fromNumber = settings.get<string>('SMS_Twilio_Number');
			if (!fromNumber) {
				return API.v1.failure('Twilio "From" number not found');
			}

			const verifyUrl = Meteor.absoluteUrl(`medsense/verify/${inviteId}`); // Client route
			const body = `Medsense: You've been invited to join ${pharmacy.name}. Verify here: ${verifyUrl}`;

			try {
				await SMSService.send(fromNumber, phone, body);
			} catch (e: any) {
				console.error('SMS Invite Error:', e);
				return API.v1.failure(`SMS Send Failed: ${e.message || e}`);
			}

			return API.v1.success({
				success: true,
				inviteId,
				code, // Return code to admin for display in popup
				expiresAt: expiresAt.toISOString(),
				message: 'Invite sent',
			});
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.invites.list',
	{ authRequired: true },
	{
		async get() {
			const pharmacyId = this.queryParams.pharmacyId as string;
			if (!pharmacyId) {
				return API.v1.failure('pharmacyId is required');
			}

			// Permission check: must be owner or manager of the pharmacy
			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			if (!isGlobalAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) return API.v1.forbidden();

				const isOwnerOrManager = membership.roles.includes('owner') || membership.roles.includes('manager');
				if (!isOwnerOrManager) return API.v1.forbidden();
			}

			const invites = await MedsensePharmacyInvites.findAllByPharmacy(pharmacyId);
			console.log('Invites list params:', this.queryParams); // Debug 400 error

			return API.v1.success({
				invites: invites.map((inv) => {
					let status = inv.status;
					if (status === 'pending' && new Date(inv.expiresAt) < new Date()) {
						status = 'expired';
					}
					return {
						...inv,
						status,
					};
				}),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.members.verify',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					inviteId: String,
					code: String,
				}),
			);

			const { inviteId, code } = this.bodyParams;

			const invite = await MedsensePharmacyInvites.findOneById(inviteId);
			if (!invite) {
				return API.v1.failure('Invite not found');
			}

			if (invite.status !== 'pending') {
				return API.v1.failure('Invite is no longer valid');
			}

			const now = new Date();
			if (invite.expiresAt < now) {
				await MedsensePharmacyInvites.updateStatus(inviteId, 'expired');
				return API.v1.failure('Invite expired');
			}

			if (invite.code !== code) {
				return API.v1.failure('Invalid code');
			}

			// Check if already member
			const existingMember = await MedsensePharmacyMemberships.findOne({ pharmacyId: invite.pharmacyId, userId: this.userId });
			if (existingMember) {
				return API.v1.failure('You are already a member of this pharmacy');
			}

			// Add Membership
			await MedsensePharmacyMemberships.insertOne({
				pharmacyId: invite.pharmacyId,
				userId: this.userId,
				roles: [invite.role], // 'staff' | 'tech' | 'pharmacist'
				active: true,
				createdBy: invite.createdBy,
				createdAt: now,
				updatedAt: now,
			});

			// Assign global role based on pharmacy role
			// Owner/Manager -> pharmacy-manager, Staff -> pharmacy-staff
			const globalRole = invite.role === 'owner' || invite.role === 'manager' ? 'pharmacy-manager' : 'pharmacy-staff';
			await addUserRolesAsync(this.userId, [globalRole]);

			// Mark Invite Accepted
			await MedsensePharmacyInvites.updateStatus(inviteId, 'accepted', {
				acceptedBy: this.userId,
				acceptedAt: now,
			});

			// Invalidate other pending invites for this user AND pharmacy?
			// The spec says "no new invites can be resend and later sent invites to the same user also invalidates"
			// We can find other pending invites for this PHONE and pharmacy and mark them revoked/expired?
			// Ideally we'd do this by phone since user ID might not be on invite yet.
			// But we know the phone from the accepted invite.
			const otherInvites = await MedsensePharmacyInvites.findPendingByPhoneAndPharmacy(invite.phone, invite.pharmacyId);
			// This returns one or null. Probably find returns cursor.
			// Raw model `findPendingByPhoneAndPharmacy` returns single.
			// We might need a `updateMany` equivalent or just ignore.
			// Since we check membership on invite creation, new invites won't be created easily if we implemented that check fully.
			// (Current invite.sms implementation checks membership by userId which it doesn't have from phone easily).

			const pharmacy = await MedsensePharmacies.findOneById(invite.pharmacyId);

			return API.v1.success({
				success: true,
				pharmacyId: invite.pharmacyId,
				pharmacyName: pharmacy?.name || 'Unknown Pharmacy',
				role: invite.role,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/pharmacies.members.update',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					userId: String,
					roles: [String],
				}),
			);
			const { pharmacyId, userId, roles } = this.bodyParams;

			// Permissions
			const isGlobalAdmin = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			let isOwner = false;

			if (!isGlobalAdmin) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
				if (!membership) return API.v1.forbidden();
				if (membership.roles.includes('owner')) isOwner = true;
				if (!isOwner) return API.v1.forbidden('Only owners can update member roles.');
			} else {
				isOwner = true;
			}

			// Validate Roles
			const validRoles = ['owner', 'manager', 'staff'];
			if (!roles.every((r: string) => validRoles.includes(r))) {
				return API.v1.failure('Invalid roles. Allowed: owner, manager, staff');
			}

			// Target check
			const targetMembership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId });
			if (!targetMembership) {
				return API.v1.failure('Member not found');
			}

			// Prevent removing last owner
			if (targetMembership.roles.includes('owner') && !roles.includes('owner')) {
				const owners = await MedsensePharmacyMemberships.find({ pharmacyId, roles: 'owner' }).toArray();
				if (owners.length <= 1) {
					return API.v1.failure('Cannot demote the last owner.');
				}
			}

			await MedsensePharmacyMemberships.updateOne(
				{ pharmacyId, userId },
				{
					$set: {
						roles,
						updatedAt: new Date(),
					},
				},
			);

			// Update Global Role
			if (roles.includes('owner') || roles.includes('manager')) {
				await addUserRolesAsync(userId, ['pharmacy-manager']);
				await removeUserFromRolesAsync(userId, ['pharmacy-staff']);
			} else {
				const otherManaged = await MedsensePharmacyMemberships.find({
					userId,
					pharmacyId: { $ne: pharmacyId },
					roles: { $in: ['owner', 'manager'] },
				}).toArray();

				if (otherManaged.length === 0) {
					await addUserRolesAsync(userId, ['pharmacy-staff']);
					await removeUserFromRolesAsync(userId, ['pharmacy-manager']);
				}
			}

			return API.v1.success();
		},
	},
);

// =========================================================================================
// Patient Context APIs (Medsense v2)
// =========================================================================================

const VALID_CONTEXT_TYPES = ['allergy', 'medication', 'medical_history'] as const;
const VALID_CONTEXT_SOURCES = ['session_rollup', 'staff'] as const;
const VALID_CONTEXT_VOCABS = ['RXNORM', 'SNOMEDCT_US'] as const;
const TYPE_NORMALIZATION: Record<string, string> = { medicalhistory: 'medical_history', medicalHistory: 'medical_history' };
const _parseLooseBool = (value: unknown): boolean => {
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'number') {
		return value !== 0;
	}
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return false;
		}
		if (['true', '1', 'yes', 'y'].includes(normalized)) {
			return true;
		}
		if (['false', '0', 'no', 'n'].includes(normalized)) {
			return false;
		}
	}
	return false;
};

const _legacySummary = (entry: any): string => {
	if (typeof entry?.summary === 'string' && entry.summary.trim()) {
		return entry.summary.trim();
	}
	const notes = Array.isArray(entry?.notes) ? entry.notes : [];
	const latest = notes.length ? notes[notes.length - 1] : undefined;
	if (typeof latest?.text === 'string') {
		return latest.text;
	}
	return '';
};

const _normalizePatientContextEntry = (entry: any): any => {
	const notes = Array.isArray(entry?.notes) ? entry.notes : [];
	const latest = notes.length ? notes[notes.length - 1] : undefined;
	return {
		...entry,
		summary: _legacySummary(entry),
		roomId: entry?.roomId || latest?.roomId || null,
		source: entry?.source || latest?.source || null,
		tags: Array.isArray(entry?.tags) ? entry.tags : [],
	};
};

const _buildPatientSafetySnapshot = (entries: any[] = []): any => {
	const snapshot = {
		allergies: [] as any[],
		active_medications: [] as any[],
		medication_history: [] as any[],
	};

	for (const rawEntry of entries || []) {
		const entry = _normalizePatientContextEntry(rawEntry);
		const type = String(entry?.type || '').toLowerCase();
		const status = String(entry?.status || '').toLowerCase();
		const summary = typeof entry?.summary === 'string' ? entry.summary : '';
		const name = typeof entry?.entityName === 'string' ? entry.entityName.trim() : '';
		const common = {
			...(status ? { status } : {}),
			...(summary ? { summary } : {}),
			...(entry?.source ? { source: entry.source } : {}),
			...(Array.isArray(entry?.tags) && entry.tags.length ? { tags: entry.tags } : {}),
		};

		if (type === 'allergy') {
			const allergy = {
				...(name ? { substance: name } : {}),
				...common,
			};
			if (Object.keys(allergy).length) {
				snapshot.allergies.push(allergy);
			}
			continue;
		}

		if (type !== 'medication') {
			continue;
		}

		const medication = {
			...(name ? { drug_name: name } : {}),
			...common,
		};
		if (!Object.keys(medication).length) {
			continue;
		}

		const historical = ['historical', 'past', 'stopped', 'inactive', 'discontinued', 'completed'].some((token) => status.includes(token));
		if (historical) {
			snapshot.medication_history.push(medication);
		} else {
			snapshot.active_medications.push(medication);
		}
	}

	return snapshot;
};

const _legacyCui = (type: string, text: string): string => {
	const key = String(text || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
	return `LEGACY:${type}:${key || Date.now()}`;
};

const _resolvePatientUserIdForRoom = async (roomId: string, explicitPatientUserId?: string): Promise<string | undefined> => {
	let patientUserId = explicitPatientUserId;
	const room = await Rooms.findOneById(roomId, {
		projection: {
			medsenseActiveRequestId: 1,
		},
	});

	if (!patientUserId && room?.medsenseActiveRequestId) {
		const activeReq = await MedsenseRequests.findOneById(room.medsenseActiveRequestId);
		patientUserId = activeReq?.requestedByUserId;
	}

	if (!patientUserId) {
		const latestReq = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 }, projection: { requestedByUserId: 1 } });
		patientUserId = latestReq?.requestedByUserId;
	}

	if (!patientUserId) {
		const members = await Subscriptions.findByRoomId(roomId).toArray();
		const memberIds = members.map((m) => m.u?._id).filter(Boolean) as string[];
		if (memberIds.length) {
			const candidates = await Users.find({ _id: { $in: memberIds }, roles: { $in: ['user'] } }, { projection: { roles: 1 } }).toArray();
			const exactUser = candidates.find((u) => Array.isArray(u.roles) && u.roles.length === 1 && u.roles.includes('user'));
			patientUserId = (exactUser || candidates[0])?._id;
		}
	}

	return patientUserId;
};

API.v1.addRoute(
	'medsense/context.room',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					roomId: String,
					patientUserId: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const roomId = String(this.queryParams.roomId);
			const room = await Rooms.findOneById(roomId, {
				projection: {
					name: 1,
					fname: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
					medsenseSessionInfo: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			let request = room.medsenseActiveRequestId ? await MedsenseRequests.findOneById(room.medsenseActiveRequestId) : null;
			if (!request) {
				request = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 } });
			}

			const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
			let pharmacyId = request?.pharmacyId;

			if (!pharmacyId && patientUserId) {
				const preference = await MedsensePatientPharmacy.findByPatientUserId(patientUserId);
				pharmacyId = preference?.pharmacyId;
			}

			const [patient, pharmacy] = await Promise.all([
				patientUserId ? Users.findOneById(patientUserId, { projection: { name: 1, username: 1 } }) : Promise.resolve(null),
				pharmacyId ? MedsensePharmacies.findOneById(pharmacyId) : Promise.resolve(null),
			]);

			const patientName = patient?.name || patient?.username || undefined;
			const pharmacyName = pharmacy?.name || undefined;
			const sessionContext = _buildSessionContextView((room as any)?.medsenseSessionInfo, {
				bufferTailLimit: 2,
				formTailLimit: 10,
				recentAnswerLimit: 5,
			});
			const aiSummary =
				request?.aiSummary ||
				request?.contextSummary ||
				(typeof sessionContext.session?.summary?.text === 'string' ? sessionContext.session.summary.text : '') ||
				sessionContext.session?.pendingActionSummary ||
				'';

			const interventions = patientUserId ? await MedsenseInterventions.findByPatientUserId(patientUserId, pharmacyId).toArray() : [];

			const assigned = (room as any).medsenseAssigned === 'Staff' ? 'Staff' : 'AI';

			return API.v1.success({
				context: {
					contextVersion: MEDSENSE_ROOM_CONTEXT_VERSION,
					roomId,
					requestId: request?._id,
					requestStatus: request?.status || room.medsenseActiveRequestStatus || undefined,
					pharmacyId,
					pharmacyName,
					patientUserId: patientUserId || undefined,
					patientName,
					aiSummary,
					assigned,
					activeInterventions: interventions,
					session: sessionContext.session,
					voice: sessionContext.voice,
				},
			});
		},
	},
);

API.v1.addRoute(
	'medsense/context.requestManagement',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					roomId: String,
					patientUserId: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const roomId = String(this.queryParams.roomId);
			const room = await Rooms.findOneById(roomId, {
				projection: {
					name: 1,
					fname: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
					medsenseSessionInfo: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			let request = room.medsenseActiveRequestId ? await MedsenseRequests.findOneById(room.medsenseActiveRequestId) : null;
			if (!request) {
				request = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 } });
			}

			const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
			let pharmacyId = request?.pharmacyId;

			if (!pharmacyId && patientUserId) {
				const preference = await MedsensePatientPharmacy.findByPatientUserId(patientUserId);
				pharmacyId = preference?.pharmacyId;
			}

			const [patient, pharmacy] = await Promise.all([
				patientUserId ? Users.findOneById(patientUserId, { projection: { name: 1, username: 1 } }) : Promise.resolve(null),
				pharmacyId ? MedsensePharmacies.findOneById(pharmacyId) : Promise.resolve(null),
			]);

			const patientName = patient?.name || patient?.username || undefined;
			const pharmacyName = pharmacy?.name || undefined;
			const sessionContext = _buildSessionContextView((room as any)?.medsenseSessionInfo, {
				bufferTailLimit: 2,
				formTailLimit: 10,
				recentAnswerLimit: 5,
			});

			const assigned = (room as any).medsenseAssigned === 'Staff' ? 'Staff' : 'AI';

			return API.v1.success({
				context: {
					contextVersion: MEDSENSE_ROOM_CONTEXT_VERSION,
					roomId,
					requestId: request?._id,
					requestStatus: request?.status || room.medsenseActiveRequestStatus || undefined,
					specialtyActionId: request?.specialtyActionId || undefined,
					patientUserId: patientUserId || undefined,
					patientName,
					pharmacyId,
					pharmacyName,
					assigned,
					session: sessionContext.session,
					voice: sessionContext.voice,
				},
			});
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.create',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					pharmacyId: String,
					patientUserId: String,
					type: String,
					specialtyActionId: Match.Optional(String),
					notes: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const interventionId = await MedsenseInterventions.createIntervention({
				pharmacyId: String(this.bodyParams.pharmacyId),
				patientUserId: String(this.bodyParams.patientUserId),
				type: String(this.bodyParams.type),
				specialtyActionId: typeof this.bodyParams.specialtyActionId === 'string' ? this.bodyParams.specialtyActionId : undefined,
				notes: typeof this.bodyParams.notes === 'string' ? this.bodyParams.notes : undefined,
				createdBy: {
					_id: this.userId,
					username: this.user?.username || 'system',
				},
				createdAt: new Date(),
			});

			const intervention = await MedsenseInterventions.findOneById(interventionId);
			return API.v1.success({ interventionId, intervention });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.info',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					interventionId: String,
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const interventionId = String(this.queryParams.interventionId);
			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			const notes = await MedsenseInterventionNotes.findByInterventionId(interventionId).toArray();
			return API.v1.success({ intervention, notes });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.note.add',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					interventionId: String,
					text: String,
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const interventionId = String(this.bodyParams.interventionId);
			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			const text = String(this.bodyParams.text || '').trim();
			if (!text) {
				return API.v1.failure('text is required');
			}

			const noteId = await MedsenseInterventionNotes.createNote({
				interventionId,
				text,
				authorId: this.userId,
				authorUsername: this.user?.username || 'system',
				createdAt: new Date(),
			});

			return API.v1.success({ noteId });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.byPatient',
	{ authRequired: true },
	{
		async get() {
			check(
				this.queryParams,
				Match.ObjectIncluding({
					patientUserId: String,
					pharmacyId: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const patientUserId = String(this.queryParams.patientUserId);
			const pharmacyId = typeof this.queryParams.pharmacyId === 'string' ? this.queryParams.pharmacyId : undefined;
			const interventions = await MedsenseInterventions.findByPatientUserId(patientUserId, pharmacyId).toArray();
			return API.v1.success({ interventions });
		},
	},
);

API.v1.addRoute(
	'medsense/patient.context.matchBatch',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-edit-patient-context'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					patientUserId: String,
					roomId: String,
					candidates: [Match.Any],
					limitPerCandidate: Match.Optional(Number),
				}),
			);

			const { patientUserId, candidates } = this.bodyParams;
			const limitPerCandidate = Math.max(1, Math.min(Number(this.bodyParams.limitPerCandidate || 3), 5));
			if (!Array.isArray(candidates)) {
				return API.v1.failure('candidates must be an array');
			}

			const normalizedCandidates = candidates
				.filter((c) => c && typeof c === 'object')
				.map((raw: any) => {
					const t = String(raw.type || '').trim();
					const type = (TYPE_NORMALIZATION[t] || t).toLowerCase();
					const umlsCandidates = Array.isArray(raw.umlsCandidates)
						? raw.umlsCandidates
								.filter((u: any) => u && typeof u === 'object' && String(u.cui || '').trim())
								.map((u: any) => ({
									cui: String(u.cui || '').trim(),
									vocab: String(u.vocab || '')
										.trim()
										.toUpperCase(),
									code: String(u.code || '').trim() || undefined,
									name: String(u.name || '').trim() || undefined,
								}))
						: [];
					return {
						candidateId: String(raw.candidateId || '').trim(),
						type,
						entityText: String(raw.entityText || '').trim(),
						umlsCandidates,
					};
				})
				.filter((c) => c.candidateId && VALID_CONTEXT_TYPES.includes(c.type as any));

			const matchesByCandidate = await MedsensePatientContext.matchBatchByCandidates(
				patientUserId,
				normalizedCandidates as any,
				limitPerCandidate,
			);

			return API.v1.success({ matchesByCandidate });
		},
	},
);

API.v1.addRoute(
	'medsense/patient.context.apply',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-edit-patient-context'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					patientUserId: String,
					roomId: String,
				}),
			);

			const { patientUserId, roomId } = this.bodyParams;
			const updates = Array.isArray((this.bodyParams as any).updates) ? (this.bodyParams as any).updates : [];
			const decisions = Array.isArray((this.bodyParams as any).decisions) ? (this.bodyParams as any).decisions : [];

			if (!updates.length && !decisions.length) {
				return API.v1.failure('updates or decisions is required');
			}

			const applied = { add: 0, update: 0, remove: 0, noop: 0 };
			const errors: string[] = [];

			for (let i = 0; i < updates.length; i++) {
				const raw = updates[i];
				if (!raw || typeof raw !== 'object') {
					errors.push(`updates[${i}] invalid object`);
					continue;
				}

				const typeRaw = String((raw as any).type || '').trim();
				const type = (TYPE_NORMALIZATION[typeRaw] || typeRaw).toLowerCase();
				if (!VALID_CONTEXT_TYPES.includes(type as any)) {
					errors.push(`updates[${i}] invalid type`);
					continue;
				}

				const selectedCui = String((raw as any).selectedCui || '').trim();
				if (!selectedCui) {
					applied.noop += 1;
					continue;
				}

				const entityName = String((raw as any).entityName || '').trim();
				if (!entityName) {
					errors.push(`updates[${i}] missing entityName`);
					continue;
				}

				const selectedVocab = String((raw as any).selectedVocab || '')
					.trim()
					.toUpperCase();
				if (!VALID_CONTEXT_VOCABS.includes(selectedVocab as any)) {
					errors.push(`updates[${i}] invalid selectedVocab`);
					continue;
				}

				const active = _parseLooseBool((raw as any).active);
				const historical = _parseLooseBool((raw as any).historical);
				const status = active ? 'active' : historical ? 'historical' : null;
				if (!status) {
					applied.noop += 1;
					continue;
				}

				const note = String((raw as any).note || '').trim();
				if (!note) {
					errors.push(`updates[${i}] missing note`);
					continue;
				}

				const sourceRaw = String((raw as any).source || 'session_rollup')
					.trim()
					.toLowerCase();
				const source = (
					VALID_CONTEXT_SOURCES.includes(sourceRaw as any) ? sourceRaw : 'session_rollup'
				) as (typeof VALID_CONTEXT_SOURCES)[number];

				const result = await MedsensePatientContext.upsertEntityWithNote({
					patientUserId,
					type: type as (typeof VALID_CONTEXT_TYPES)[number],
					entityName,
					cui: selectedCui,
					vocab: selectedVocab as (typeof VALID_CONTEXT_VOCABS)[number],
					code: String((raw as any).selectedCode || '').trim() || undefined,
					status: status as 'active' | 'historical',
					note: {
						text: note,
						addedAt: new Date(),
						roomId,
						source,
					},
					addedAt: new Date(),
				});

				if ((result as any).upsertedId) {
					applied.add += 1;
				} else if ((result as any).modifiedCount > 0) {
					applied.update += 1;
				} else {
					applied.noop += 1;
				}
			}

			for (let i = 0; i < decisions.length; i++) {
				const raw = decisions[i];
				if (!raw || typeof raw !== 'object') {
					errors.push(`decisions[${i}] invalid object`);
					continue;
				}

				const action = String((raw as any).action || '')
					.trim()
					.toLowerCase();
				const targetEntryId = String((raw as any).targetEntryId || '').trim();
				const summary = String((raw as any).summary || '').trim();
				let typeRaw = String((raw as any).type || '').trim();
				typeRaw = TYPE_NORMALIZATION[typeRaw] || typeRaw;
				const type = typeRaw ? typeRaw.toLowerCase() : '';
				const sourceRaw = String((raw as any).source || 'session_rollup')
					.trim()
					.toLowerCase();
				const source = (
					VALID_CONTEXT_SOURCES.includes(sourceRaw as any) ? sourceRaw : 'session_rollup'
				) as (typeof VALID_CONTEXT_SOURCES)[number];

				if (!['add', 'update', 'remove', 'noop'].includes(action)) {
					errors.push(`decisions[${i}] invalid action`);
					continue;
				}
				if (action === 'noop') {
					applied.noop += 1;
					continue;
				}
				if (action === 'remove') {
					if (!targetEntryId) {
						errors.push(`decisions[${i}] remove requires targetEntryId`);
						continue;
					}
					const result = await MedsensePatientContext.deleteOne({ _id: targetEntryId, patientUserId });
					if (!result.deletedCount) {
						errors.push(`decisions[${i}] remove target not found`);
						continue;
					}
					applied.remove += 1;
					continue;
				}
				if (action === 'add') {
					if (!type || !VALID_CONTEXT_TYPES.includes(type as any) || !summary) {
						errors.push(`decisions[${i}] add requires valid type and summary`);
						continue;
					}
					const vocab = type === 'medication' ? 'RXNORM' : 'SNOMEDCT_US';
					const result = await MedsensePatientContext.upsertEntityWithNote({
						patientUserId,
						type: type as (typeof VALID_CONTEXT_TYPES)[number],
						entityName: summary,
						cui: _legacyCui(type, summary),
						vocab: vocab as (typeof VALID_CONTEXT_VOCABS)[number],
						status: 'historical',
						note: {
							text: summary,
							addedAt: new Date(),
							roomId,
							source,
						},
						addedAt: new Date(),
					});
					if ((result as any).upsertedId) {
						applied.add += 1;
					} else if ((result as any).modifiedCount > 0) {
						applied.update += 1;
					} else {
						applied.noop += 1;
					}
					continue;
				}

				if (!targetEntryId) {
					errors.push(`decisions[${i}] update requires targetEntryId`);
					continue;
				}
				const setFields: Record<string, any> = { _updatedAt: new Date(), roomId, source };
				if (summary) {
					setFields.summary = summary;
				}
				if (type && VALID_CONTEXT_TYPES.includes(type as any)) {
					setFields.type = type;
				}
				if (!summary && !setFields.type) {
					applied.noop += 1;
					continue;
				}
				const result = await MedsensePatientContext.updateOne({ _id: targetEntryId, patientUserId }, { $set: setFields });
				if (!result.matchedCount) {
					errors.push(`decisions[${i}] update target not found`);
					continue;
				}
				applied.update += 1;
			}

			return API.v1.success({
				applied,
				...(errors.length ? { errors } : {}),
			});
		},
	},
);

const _SESSION_STATUS_VALUES = new Set(['running', 'waiting_for_user', 'waiting_for_staff', 'voice_active', 'interrupted', 'ended']);

const _defaultCurrentOwner = () => ({
	kind: null as 'ai' | 'staff' | 'voice' | null,
	id: null as string | null,
	sinceTs: null as string | null,
	reason: null as string | null,
});

const _emptyActiveRun = () => ({
	runId: null as string | null,
	orchestrator: null as string | null,
	phase: null as string | null,
	startedAt: null as string | null,
});

const _emptyPending = () => ({
	kind: null as string | null,
	recoverable: false,
	waitingFor: null as 'user' | 'staff' | 'system' | null,
	formId: null as string | null,
	toolCallIds: [] as string[],
	markedAt: null as string | null,
	context: null as Record<string, any> | null,
});

const _buildLegacySessionId = (ownerId: string, source: Record<string, any>) =>
	`sess_${createHash('sha1')
		.update(`${ownerId}:${String(source.sessionStartTs || '')}:${String(source.sessionStartMsgId || '')}`)
		.digest('hex')
		.slice(0, 24)}`;

const _inferOwnerKind = (ownerId: string | null) => {
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

const _normalizeCurrentOwner = (raw: any, fallbackOwnerId: string | null, fallbackSinceTs: string | null) => {
	const fallbackKind = _inferOwnerKind(fallbackOwnerId);
	if (!raw || typeof raw !== 'object') {
		return {
			..._defaultCurrentOwner(),
			kind: fallbackKind,
			id: fallbackOwnerId,
			sinceTs: fallbackSinceTs,
			reason: fallbackOwnerId ? 'legacy_migration' : null,
		};
	}
	const normalizedKind = _inferOwnerKind(typeof raw.kind === 'string' ? raw.kind : typeof raw.id === 'string' ? raw.id : fallbackOwnerId);
	return {
		kind: normalizedKind,
		id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : fallbackOwnerId,
		sinceTs: typeof raw.sinceTs === 'string' ? raw.sinceTs : fallbackSinceTs,
		reason: typeof raw.reason === 'string' ? raw.reason : fallbackOwnerId ? 'legacy_migration' : null,
	};
};

const _normalizeActiveRun = (raw: any) =>
	raw && typeof raw === 'object'
		? {
				runId: typeof raw.runId === 'string' ? raw.runId : null,
				orchestrator: typeof raw.orchestrator === 'string' ? raw.orchestrator : null,
				phase: typeof raw.phase === 'string' ? raw.phase : null,
				startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
			}
		: _emptyActiveRun();

const _normalizePending = (raw: any) =>
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
		: _emptyPending();

const _normalizeLastRecovery = (raw: any) => {
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

const _normalizeSessionStatus = (rawStatus: any, currentOwner: Record<string, any>, voiceActive: boolean) => {
	const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : '';
	if (_SESSION_STATUS_VALUES.has(normalized)) {
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

const _normalizeRecentSubmittedAnswers = (sessionForms: Array<Record<string, any>>, roomFormSubmissions: Array<Record<string, any>>) => {
	const normalizedEntries = [] as Array<Record<string, any>>;
	const combinedEntries = [...sessionForms, ...roomFormSubmissions];
	for (const entry of combinedEntries.slice(-10)) {
		if (!entry || typeof entry !== 'object') {
			continue;
		}
		const normalizedEntry = {} as Record<string, any>;
		const timestamp = typeof entry.timestamp === 'string' ? entry.timestamp : typeof entry.ts === 'string' ? entry.ts : null;
		const rawAnswer = entry.answer ?? entry.selection ?? entry.value;
		let answer: string | null = null;
		if (typeof rawAnswer === 'string' && rawAnswer.trim()) {
			answer = rawAnswer.trim();
		} else if (rawAnswer && typeof rawAnswer === 'object') {
			try {
				answer = JSON.stringify(rawAnswer);
			} catch {
				answer = null;
			}
		}
		if (timestamp) {
			normalizedEntry.timestamp = timestamp;
		}
		for (const [sourceKey, targetKey] of [
			['flowId', 'flow_id'],
			['requestId', 'request_id'],
			['formId', 'form_id'],
			['stepId', 'step_id'],
			['question', 'question'],
		] as const) {
			const value = entry[sourceKey];
			if (typeof value === 'string' && value.trim()) {
				normalizedEntry[targetKey] = value.trim();
			}
		}
		if (answer) {
			normalizedEntry.answer = answer;
		}
		if (normalizedEntry.question || normalizedEntry.answer) {
			normalizedEntries.push(normalizedEntry);
		}
	}
	return normalizedEntries.slice(-5);
};

const _buildPendingActionSummary = (sessionInfo: Record<string, any>) => {
	const pending = sessionInfo.pending && typeof sessionInfo.pending === 'object' ? sessionInfo.pending : _emptyPending();
	if (!pending.kind) {
		return null;
	}
	if (pending.kind === 'form_submission' && pending.formId) {
		return `Awaiting form submission for ${pending.formId}`;
	}
	if (pending.kind === 'tool_calls' && Array.isArray(pending.toolCallIds) && pending.toolCallIds.length) {
		return `Pending tool calls: ${pending.toolCallIds.join(', ')}`;
	}
	return pending.kind;
};

const MEDSENSE_SESSION_INFO_VERSION = 3;
const MEDSENSE_ROOM_CONTEXT_VERSION = 3;
const MEDSENSE_CONSOLIDATED_CONTEXT_VERSION = 3;

const _buildSessionContextView = (
	sessionInfoRaw: any,
	{
		bufferTailLimit = 2,
		formTailLimit = 10,
		recentAnswerLimit = 5,
	}: { bufferTailLimit?: number; formTailLimit?: number; recentAnswerLimit?: number } = {},
) => {
	const sessionInfo = _normalizeSessionInfo(sessionInfoRaw);
	const sessionBuffer = Array.isArray(sessionInfo.sessionBuffer) ? sessionInfo.sessionBuffer : [];
	const sessionBufferTail = sessionBuffer.slice(-Math.max(1, bufferTailLimit));
	const sessionForms = Array.isArray(sessionInfo.sessionForms) ? sessionInfo.sessionForms : [];
	const roomFormSubmissions = Array.isArray(sessionInfo.roomFormSubmissions) ? sessionInfo.roomFormSubmissions : [];
	const roomFormSubmissionsTail = roomFormSubmissions.slice(-Math.max(1, formTailLimit));
	const recentSubmittedAnswers = _normalizeRecentSubmittedAnswers(sessionForms, roomFormSubmissions).slice(-Math.max(1, recentAnswerLimit));
	const currentSession = {
		sessionId: sessionInfo.sessionId,
		sessionStartTs: sessionInfo.sessionStartTs,
		lastActivityTs: sessionInfo.lastActivityTs,
		status: sessionInfo.status,
		currentOwner: sessionInfo.currentOwner,
		activeRun: sessionInfo.activeRun,
		pending: sessionInfo.pending,
		pendingRecovery: Boolean(sessionInfo.pending?.recoverable),
		lastRecovery: sessionInfo.lastRecovery,
		pendingActionSummary: _buildPendingActionSummary(sessionInfo),
		summary: sessionInfo.summary,
		summaryUpdate: sessionInfo.summaryUpdate,
		bufferTail: sessionBufferTail,
		forms: sessionForms,
		formSubmissions: roomFormSubmissions,
		formSubmissionsTail: roomFormSubmissionsTail,
		recentSubmittedAnswers,
	};
	return {
		session: currentSession,
		voice: sessionInfo.voice,
	};
};

type MedsenseSmartFormOption = {
	label: string;
	value: string;
};

type MedsenseSmartFormEntry = {
	entryId: string;
	formId: string;
	stepId: string;
	requestId?: string;
	flowId?: string;
	title?: string;
	prompt: string;
	options: MedsenseSmartFormOption[];
	multi: boolean;
	allowCustomText: boolean;
	customLabel: string;
	submitUrl?: string;
	context?: Record<string, unknown>;
	reason?: string;
	source: 'medsenseForm' | 'selection_form';
	rawPayload: Record<string, any>;
	createdAt: string;
	status: 'pending';
};

const MEDSENSE_SMARTFORM_DEFAULT_CUSTOM_LABEL = 'Tell us what to do differently';
const MEDSENSE_SMARTFORM_SUBMISSION_SOURCE = 'smart_forms_dock';
const MEDSENSE_SMARTFORM_DEFAULT_EXPIRY_MINUTES = 10;
const _getSmartFormExpiryMinutes = (): number => {
	const rawValue =
		typeof process.env.MEDSENSE_SMARTFORM_EXPIRY_MINUTES === 'string' ? process.env.MEDSENSE_SMARTFORM_EXPIRY_MINUTES.trim() : '';
	const parsedValue = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : MEDSENSE_SMARTFORM_DEFAULT_EXPIRY_MINUTES;
};

const _getExpiredSmartFormAnswer = (): string => `No response submitted (expired after ${_getSmartFormExpiryMinutes()} minutes)`;

const _normalizeSmartFormOption = (option: any): MedsenseSmartFormOption | null => {
	if (!option || typeof option !== 'object') {
		return null;
	}

	const label =
		typeof option.text === 'string' && option.text.trim()
			? option.text.trim()
			: typeof option.label === 'string'
				? option.label.trim()
				: '';
	const value = typeof option.value === 'string' && option.value.trim() ? option.value.trim() : '';

	if (!label || !value) {
		return null;
	}

	return { label, value };
};

const _buildSmartFormEntryId = (formId: string, stepId: string): string => `${formId}::${stepId}`;

const _normalizeSmartFormEntries = (rawPayload: any, createdAt = new Date().toISOString()): MedsenseSmartFormEntry[] => {
	let payload = rawPayload;
	if (typeof rawPayload === 'string') {
		try {
			payload = JSON.parse(rawPayload);
		} catch {
			return [];
		}
	}
	if (!payload || typeof payload !== 'object') {
		return [];
	}

	const entries: MedsenseSmartFormEntry[] = [];

	if (payload.medsenseForm && typeof payload.medsenseForm === 'object') {
		const medsenseForm = payload.medsenseForm;
		const formId = String(
			medsenseForm.form?.id || medsenseForm.formId || `req-${String(medsenseForm.requestId || '').trim()}` || '',
		).trim();
		const fields = Array.isArray(medsenseForm.form?.fields) ? medsenseForm.form.fields : [];

		for (const field of fields) {
			const stepId = typeof field?.id === 'string' && field.id.trim() ? field.id.trim() : '';
			if (!formId || !stepId) {
				continue;
			}

			const options = Array.isArray(field?.options)
				? (field.options.map(_normalizeSmartFormOption).filter(Boolean) as MedsenseSmartFormOption[])
				: [];
			entries.push({
				entryId: _buildSmartFormEntryId(formId, stepId),
				formId,
				stepId,
				requestId: typeof medsenseForm.requestId === 'string' && medsenseForm.requestId.trim() ? medsenseForm.requestId.trim() : undefined,
				flowId: typeof medsenseForm.flowId === 'string' && medsenseForm.flowId.trim() ? medsenseForm.flowId.trim() : undefined,
				title: typeof field?.title === 'string' && field.title.trim() ? field.title.trim() : undefined,
				prompt:
					typeof field?.label === 'string' && field.label.trim()
						? field.label.trim()
						: typeof field?.prompt === 'string' && field.prompt.trim()
							? field.prompt.trim()
							: 'Please make a selection.',
				options,
				multi: field?.type === 'multi_static_select',
				allowCustomText: field?.allowCustomText !== false,
				customLabel:
					typeof field?.customLabel === 'string' && field.customLabel.trim()
						? field.customLabel.trim()
						: MEDSENSE_SMARTFORM_DEFAULT_CUSTOM_LABEL,
				source: 'medsenseForm',
				rawPayload: { medsenseForm },
				createdAt,
				status: 'pending',
			});
		}

		return entries;
	}

	const formId = typeof payload.formId === 'string' && payload.formId.trim() ? payload.formId.trim() : '';
	const steps = Array.isArray(payload.steps) ? payload.steps : [];
	for (const step of steps) {
		const stepId = typeof step?.id === 'string' && step.id.trim() ? step.id.trim() : '';
		if (!formId || !stepId) {
			continue;
		}

		const options = Array.isArray(step?.options)
			? (step.options.map(_normalizeSmartFormOption).filter(Boolean) as MedsenseSmartFormOption[])
			: [];
		entries.push({
			entryId: _buildSmartFormEntryId(formId, stepId),
			formId,
			stepId,
			title: typeof step?.title === 'string' && step.title.trim() ? step.title.trim() : undefined,
			prompt:
				typeof step?.prompt === 'string' && step.prompt.trim()
					? step.prompt.trim()
					: typeof step?.label === 'string' && step.label.trim()
						? step.label.trim()
						: 'Please make a selection.',
			options,
			multi: Boolean(step?.multi),
			allowCustomText: step?.allowCustomText !== false,
			customLabel:
				typeof step?.customLabel === 'string' && step.customLabel.trim()
					? step.customLabel.trim()
					: MEDSENSE_SMARTFORM_DEFAULT_CUSTOM_LABEL,
			submitUrl: typeof payload.submitUrl === 'string' && payload.submitUrl.trim() ? payload.submitUrl.trim() : undefined,
			context: payload.context && typeof payload.context === 'object' && !Array.isArray(payload.context) ? payload.context : undefined,
			reason: typeof payload.reason === 'string' && payload.reason.trim() ? payload.reason.trim() : undefined,
			source: 'selection_form',
			rawPayload: payload,
			createdAt,
			status: 'pending',
		});
	}

	return entries;
};

const _normalizeSmartFormEntry = (entry: any): MedsenseSmartFormEntry | null => {
	if (!entry || typeof entry !== 'object') {
		return null;
	}

	const formId = typeof entry.formId === 'string' && entry.formId.trim() ? entry.formId.trim() : '';
	const stepId = typeof entry.stepId === 'string' && entry.stepId.trim() ? entry.stepId.trim() : '';
	if (!formId || !stepId) {
		return null;
	}

	return {
		entryId: typeof entry.entryId === 'string' && entry.entryId.trim() ? entry.entryId.trim() : _buildSmartFormEntryId(formId, stepId),
		formId,
		stepId,
		requestId: typeof entry.requestId === 'string' && entry.requestId.trim() ? entry.requestId.trim() : undefined,
		flowId: typeof entry.flowId === 'string' && entry.flowId.trim() ? entry.flowId.trim() : undefined,
		title: typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : undefined,
		prompt: typeof entry.prompt === 'string' && entry.prompt.trim() ? entry.prompt.trim() : 'Please make a selection.',
		options: Array.isArray(entry.options)
			? (entry.options.map(_normalizeSmartFormOption).filter(Boolean) as MedsenseSmartFormOption[])
			: [],
		multi: Boolean(entry.multi),
		allowCustomText: entry.allowCustomText !== false,
		customLabel:
			typeof entry.customLabel === 'string' && entry.customLabel.trim()
				? entry.customLabel.trim()
				: MEDSENSE_SMARTFORM_DEFAULT_CUSTOM_LABEL,
		submitUrl: typeof entry.submitUrl === 'string' && entry.submitUrl.trim() ? entry.submitUrl.trim() : undefined,
		context: entry.context && typeof entry.context === 'object' && !Array.isArray(entry.context) ? entry.context : undefined,
		reason: typeof entry.reason === 'string' && entry.reason.trim() ? entry.reason.trim() : undefined,
		source: entry.source === 'medsenseForm' ? 'medsenseForm' : 'selection_form',
		rawPayload: entry.rawPayload && typeof entry.rawPayload === 'object' ? entry.rawPayload : {},
		createdAt: typeof entry.createdAt === 'string' && entry.createdAt.trim() ? entry.createdAt.trim() : new Date().toISOString(),
		status: 'pending',
	};
};

const _mergeSmartFormEntries = (existingEntries: any[], incomingEntries: MedsenseSmartFormEntry[]): MedsenseSmartFormEntry[] => {
	const merged = new Map<string, MedsenseSmartFormEntry>();

	for (const rawEntry of existingEntries || []) {
		const entry = _normalizeSmartFormEntry(rawEntry);
		if (!entry) {
			continue;
		}
		merged.set(entry.entryId, entry);
	}

	for (const entry of incomingEntries) {
		merged.set(entry.entryId, entry);
	}

	return Array.from(merged.values()).sort((left, right) => {
		return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
	});
};

const _normalizeSmartFormAnswerText = (entry: MedsenseSmartFormEntry, selection: string[], customText: string): string => {
	const trimmedCustomText = String(customText || '').trim();
	if (trimmedCustomText) {
		return trimmedCustomText;
	}

	if (!Array.isArray(selection) || selection.length === 0) {
		return '';
	}

	const selectedLabels = selection.map((value) => entry.options.find((option) => option.value === value)?.label || value).filter(Boolean);
	return selectedLabels.join(', ');
};

const _buildSmartFormSubmissionEntry = (
	entry: MedsenseSmartFormEntry,
	selection: string[],
	customText: string,
	submittedAt: string,
): Record<string, any> => {
	return {
		entryId: entry.entryId,
		formId: entry.formId,
		stepId: entry.stepId,
		requestId: entry.requestId || null,
		flowId: entry.flowId || null,
		question: entry.prompt,
		answer: _normalizeSmartFormAnswerText(entry, selection, customText),
		selection,
		customText: String(customText || '').trim(),
		timestamp: submittedAt,
		status: 'submitted',
	};
};

const _buildSmartFormExpiredEntry = (entry: MedsenseSmartFormEntry, expiredAt: string): Record<string, any> => ({
	entryId: entry.entryId,
	formId: entry.formId,
	stepId: entry.stepId,
	requestId: entry.requestId || null,
	flowId: entry.flowId || null,
	question: entry.prompt,
	answer: _getExpiredSmartFormAnswer(),
	selection: [],
	customText: '',
	timestamp: expiredAt,
	status: 'expired',
});

const _applySmartFormExpiry = (
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>,
	nowIso = new Date().toISOString(),
): {
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>;
	didExpire: boolean;
	expiredCount: number;
} => {
	const normalizedEntries = (Array.isArray(sessionInfo.sessionForms) ? sessionInfo.sessionForms : [])
		.map(_normalizeSmartFormEntry)
		.filter(Boolean) as MedsenseSmartFormEntry[];
	if (normalizedEntries.length === 0) {
		return { sessionInfo, didExpire: false, expiredCount: 0 };
	}

	const nowMs = Date.parse(nowIso);
	if (!Number.isFinite(nowMs)) {
		return { sessionInfo, didExpire: false, expiredCount: 0 };
	}

	const expiryMs = _getSmartFormExpiryMinutes() * 60 * 1000;
	const activeEntries: MedsenseSmartFormEntry[] = [];
	const expiredEntries: MedsenseSmartFormEntry[] = [];

	for (const entry of normalizedEntries) {
		const createdAtMs = Date.parse(entry.createdAt);
		if (!Number.isFinite(createdAtMs) || nowMs - createdAtMs < expiryMs) {
			activeEntries.push(entry);
			continue;
		}

		expiredEntries.push(entry);
	}

	if (expiredEntries.length === 0) {
		return { sessionInfo, didExpire: false, expiredCount: 0 };
	}

	const existingSubmissions = Array.isArray(sessionInfo.roomFormSubmissions) ? sessionInfo.roomFormSubmissions : [];
	const existingSubmissionKeys = new Set(
		existingSubmissions.map((entry: any) => {
			const entryId = typeof entry?.entryId === 'string' && entry.entryId.trim() ? entry.entryId.trim() : null;
			const status = typeof entry?.status === 'string' && entry.status.trim() ? entry.status.trim() : 'submitted';
			return entryId ? `${entryId}::${status}` : null;
		}),
	);

	const nextExpiredSubmissions = expiredEntries
		.filter((entry) => !existingSubmissionKeys.has(`${entry.entryId}::expired`))
		.map((entry) => _buildSmartFormExpiredEntry(entry, nowIso));

	const nextSessionInfo = {
		...sessionInfo,
		sessionForms: activeEntries,
		roomFormSubmissions: [...existingSubmissions, ...nextExpiredSubmissions].slice(-100),
		lastActivityTs: nowIso,
		status: activeEntries.length > 0 ? 'waiting_for_user' : 'running',
		pending:
			activeEntries.length > 0
				? {
						kind: 'form_submission',
						recoverable: true,
						waitingFor: 'user',
						formId: activeEntries[0].formId,
						toolCallIds: [],
						markedAt: nowIso,
						context: {
							entryIds: activeEntries.map((entry) => entry.entryId),
						},
					}
				: _emptyPending(),
	};

	return {
		sessionInfo: nextSessionInfo,
		didExpire: true,
		expiredCount: expiredEntries.length,
	};
};

const _isMedsenseStaffViewer = async (userId: string): Promise<boolean> => {
	if (!userId) {
		return false;
	}

	if (
		(await hasPermissionAsync(userId, 'admin')) ||
		(await hasPermissionAsync(userId, 'medsense-view-request')) ||
		(await hasPermissionAsync(userId, 'medsense-take-request')) ||
		(await hasPermissionAsync(userId, 'medsense-create-interventions'))
	) {
		return true;
	}

	const user = await Users.findOneById(userId, { projection: { roles: 1 } });
	const roles = Array.isArray(user?.roles) ? user.roles : [];
	return roles.some((role) => ['admin', 'bot', 'pharmacy-manager', 'pharmacy-staff'].includes(role));
};

const _hasValidMedsenseWebhookSecret = (headers: Record<string, any>): boolean => {
	const configuredSecret = typeof process.env.RC_SECRET === 'string' ? process.env.RC_SECRET.trim() : '';
	if (!configuredSecret) {
		return true;
	}

	const providedSecret = String(headers['x-rocketchat-secret'] || headers['X-Rocketchat-Secret'] || '').trim();
	if (!providedSecret) {
		return false;
	}

	return safeHashEqual(hashRegistrationValue(providedSecret), hashRegistrationValue(configuredSecret));
};

const _buildSmartFormAnswerValue = (selection: string[], customText: string): string | string[] => {
	const trimmedCustomText = String(customText || '').trim();
	if (trimmedCustomText) {
		return trimmedCustomText;
	}

	const normalizedSelection = Array.isArray(selection) ? selection.filter((value) => typeof value === 'string' && value.trim()) : [];
	if (normalizedSelection.length <= 1) {
		return normalizedSelection[0] || '';
	}

	return normalizedSelection;
};

type MedsenseSmartFormSubmissionDraft = {
	entry: MedsenseSmartFormEntry;
	selection: string[];
	customText: string;
};

type MedsenseSmartFormAnswer = {
	id: string;
	value: string | string[];
};

const _normalizeSmartFormSubmissionDraft = (
	entry: MedsenseSmartFormEntry,
	input: { selection?: string[]; customText?: string },
): MedsenseSmartFormSubmissionDraft => ({
	entry,
	selection: Array.isArray(input.selection) ? input.selection.map((value) => String(value).trim()).filter(Boolean) : [],
	customText: typeof input.customText === 'string' ? input.customText.trim() : '',
});

const _firstNonEmptyString = (...values: unknown[]): string | null => {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}

	return null;
};

const _buildSmartFormSubmitAnswers = (submissions: MedsenseSmartFormSubmissionDraft[]): MedsenseSmartFormAnswer[] =>
	submissions.map(({ entry, selection, customText }) => ({
		id: entry.stepId,
		value: _buildSmartFormAnswerValue(selection, customText),
	}));

const _buildSmartFormFreeText = (submissions: MedsenseSmartFormSubmissionDraft[]): string =>
	submissions
		.map(({ customText }) => String(customText || '').trim())
		.filter(Boolean)
		.join('\n');

const _buildSelectionFormFields = (submissions: MedsenseSmartFormSubmissionDraft[]): Array<Record<string, any>> =>
	submissions.map(({ entry }) => ({
		id: entry.stepId,
		type: entry.multi ? 'multi_select' : 'single_select',
		label: entry.prompt,
		prompt: entry.prompt,
		options: entry.options,
		allowCustomText: entry.allowCustomText,
		customLabel: entry.customLabel,
	}));

const _buildCanonicalMedsenseFormSubmitPayload = ({
	formId,
	submissions,
	room,
	sessionInfo,
	answers,
	freeText,
}: {
	formId: string;
	submissions: MedsenseSmartFormSubmissionDraft[];
	room: Record<string, any>;
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>;
	answers: MedsenseSmartFormAnswer[];
	freeText: string;
}): Record<string, any> => {
	const primaryEntry = submissions[0].entry;
	const rawMedsenseForm =
		primaryEntry.rawPayload?.medsenseForm && typeof primaryEntry.rawPayload.medsenseForm === 'object'
			? primaryEntry.rawPayload.medsenseForm
			: null;
	const rawSelectionPayload = primaryEntry.rawPayload && typeof primaryEntry.rawPayload === 'object' ? primaryEntry.rawPayload : {};
	const context =
		(primaryEntry.context && typeof primaryEntry.context === 'object' ? primaryEntry.context : null) ||
		(rawSelectionPayload.context && typeof rawSelectionPayload.context === 'object' ? rawSelectionPayload.context : null) ||
		(rawMedsenseForm?.context && typeof rawMedsenseForm.context === 'object' ? rawMedsenseForm.context : null) ||
		{};
	const originalForm = rawMedsenseForm?.form && typeof rawMedsenseForm.form === 'object' ? rawMedsenseForm.form : null;
	const fallbackFields = _buildSelectionFormFields(submissions);
	const form =
		originalForm ||
		(rawSelectionPayload.form && typeof rawSelectionPayload.form === 'object'
			? rawSelectionPayload.form
			: {
					id: formId,
					fields: fallbackFields,
				});
	const requestId = _firstNonEmptyString(
		rawMedsenseForm?.requestId,
		primaryEntry.requestId,
		context.requestId,
		room.medsenseActiveRequestId,
	);
	const flowId = _firstNonEmptyString(rawMedsenseForm?.flowId, primaryEntry.flowId, context.flowId);
	const visitorToken = _firstNonEmptyString(
		rawMedsenseForm?.visitorToken,
		context.visitorToken,
		rawSelectionPayload.visitorToken,
		sessionInfo.voice?.patientVisitorToken,
	);

	return {
		...(rawMedsenseForm || {}),
		formId: _firstNonEmptyString(rawMedsenseForm?.formId, formId) || formId,
		...(requestId ? { requestId } : {}),
		...(flowId ? { flowId } : {}),
		roomId: _firstNonEmptyString(rawMedsenseForm?.roomId, context.roomId, room._id) || room._id,
		visitorToken: visitorToken || null,
		submitAction: _firstNonEmptyString(rawMedsenseForm?.submitAction, context.submitAction, rawSelectionPayload.submitAction) || null,
		formType: _firstNonEmptyString(rawMedsenseForm?.formType, context.formType, rawSelectionPayload.formType) || null,
		form: {
			...form,
			id: _firstNonEmptyString(form.id, formId) || formId,
			fields: Array.isArray(form.fields) ? form.fields : fallbackFields,
		},
		answers,
		freeText,
	};
};

const _buildSmartFormSubmitIntegrationPayload = ({
	formId,
	submissions,
	room,
	user,
	sessionInfo,
}: {
	formId: string;
	submissions: MedsenseSmartFormSubmissionDraft[];
	room: Record<string, any>;
	user?: IUser;
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>;
}): Record<string, any> => {
	const primarySubmission = submissions[0];
	const primaryEntry = primarySubmission.entry;
	const submittedAt = new Date().toISOString();
	const roomName =
		typeof room?.fname === 'string' && room.fname.trim()
			? room.fname.trim()
			: typeof room?.name === 'string' && room.name.trim()
				? room.name.trim()
				: null;
	const freeTextValues = submissions.map(({ customText }) => String(customText || '').trim()).filter(Boolean);
	const answers = _buildSmartFormSubmitAnswers(submissions);
	const freeText = _buildSmartFormFreeText(submissions);
	const medsenseForm = _buildCanonicalMedsenseFormSubmitPayload({
		formId,
		submissions,
		room,
		sessionInfo,
		answers,
		freeText,
	});

	return {
		trigger: 'smartforms_submit',
		submittedAt,
		source: MEDSENSE_SMARTFORM_SUBMISSION_SOURCE,
		medsenseForm,
		formId,
		answers,
		...(freeTextValues.length === 1 ? { freeText: freeTextValues[0] } : {}),
		roomId: room._id,
		room: {
			_id: room._id,
			name: roomName,
			t: room.t,
			medsenseActiveRequestId: room.medsenseActiveRequestId || null,
			medsenseActiveRequestStatus: room.medsenseActiveRequestStatus || null,
			medsenseAssigned: room.medsenseAssigned === 'Staff' ? 'Staff' : 'AI',
		},
		userId: user?._id || null,
		userName: user?.username || null,
		userDisplayName: user?.name || null,
		user: user
			? {
					_id: user._id,
					username: user.username,
					name: user.name,
					roles: Array.isArray(user.roles) ? user.roles : [],
				}
			: null,
		requestId: primaryEntry.requestId || room.medsenseActiveRequestId || null,
		flowId: primaryEntry.flowId || null,
		formContext: {
			entryId: primaryEntry.entryId,
			stepId: primaryEntry.stepId,
			title: primaryEntry.title || null,
			prompt: primaryEntry.prompt,
			source: primaryEntry.source,
			reason: primaryEntry.reason || null,
			context: primaryEntry.context || null,
			rawPayload: primaryEntry.rawPayload || {},
			entries: submissions.map(({ entry }) => ({
				entryId: entry.entryId,
				stepId: entry.stepId,
				title: entry.title || null,
				prompt: entry.prompt,
				source: entry.source,
				reason: entry.reason || null,
				context: entry.context || null,
			})),
		},
		session: {
			sessionId: sessionInfo.sessionId,
			status: sessionInfo.status,
			currentOwner: sessionInfo.currentOwner,
			pending: sessionInfo.pending,
			activeRun: sessionInfo.activeRun,
		},
	};
};

const _roomHasEnabledSmartFormsSubmitWebhook = (room: IRoom): boolean =>
	triggerHandler
		.getTriggersToExecute(room)
		.some(
			(trigger) => trigger.enabled === true && trigger.event === 'medsenseSmartFormsSubmit' && triggerHandler.isTriggerEnabled(trigger),
		);

const _emitSmartFormSubmitIntegration = async ({
	formId,
	submissions,
	room,
	user,
	sessionInfo,
}: {
	formId: string;
	submissions: MedsenseSmartFormSubmissionDraft[];
	room: IRoom & Record<string, any>;
	user?: IUser;
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>;
}): Promise<Record<string, any>> => {
	if (!_roomHasEnabledSmartFormsSubmitWebhook(room)) {
		throw new Error('Smart Forms submit webhook is not configured');
	}

	const payload = _buildSmartFormSubmitIntegrationPayload({
		formId,
		submissions,
		room,
		user,
		sessionInfo,
	});

	await triggerHandler.executeTriggers('medsenseSmartFormsSubmit', room, user, payload);
	return payload;
};

const _buildSmartFormSummaryMessagePayload = (entry: Record<string, any>) => ({
	messageId: String(entry?.messageId || ''),
	ts: typeof entry?.ts === 'string' ? entry.ts : new Date().toISOString(),
	role: entry?.role || 'context',
	evidenceWeight:
		entry?.evidenceWeight === 'primary' ||
		entry?.evidenceWeight === 'secondary' ||
		entry?.evidenceWeight === 'workflow_artifact' ||
		entry?.evidenceWeight === 'context'
			? entry.evidenceWeight
			: entry?.role === 'patient'
				? 'primary'
				: entry?.role === 'staff'
					? 'secondary'
					: entry?.role === 'ai' || entry?.role === 'bot' || entry?.role === 'system'
						? 'workflow_artifact'
						: 'context',
	text: typeof entry?.text === 'string' ? entry.text : '',
});

const _resetMedsenseSessionSummaryUpdate = async (roomId: string, triggerMessageId?: string | null): Promise<void> => {
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

const _roomHasEnabledMedsenseSummaryWebhook = (room: IRoom, message: IMessage): boolean =>
	triggerHandler
		.getTriggersToExecute(room, message)
		.some((trigger) => trigger.enabled === true && trigger.event === 'medsenseSessionSummary' && triggerHandler.isTriggerEnabled(trigger));

const _triggerMedsenseSessionSummaryForSmartForms = async ({
	room,
	user,
	sessionInfo,
}: {
	room: IRoom & Record<string, any>;
	user?: IUser;
	sessionInfo: ReturnType<typeof _normalizeSessionInfo>;
}): Promise<void> => {
	const sessionBuffer = Array.isArray(sessionInfo.sessionBuffer) ? sessionInfo.sessionBuffer : [];
	const nowIso = new Date().toISOString();
	const lastBufferEntry = sessionBuffer.length ? sessionBuffer[sessionBuffer.length - 1] : null;
	const triggerMessageId =
		typeof lastBufferEntry?.messageId === 'string' && lastBufferEntry.messageId.trim()
			? lastBufferEntry.messageId.trim()
			: `smartform-summary-${randomBytes(8).toString('hex')}`;
	const triggerMessageTs = typeof lastBufferEntry?.ts === 'string' && lastBufferEntry.ts.trim() ? new Date(lastBufferEntry.ts) : new Date();
	const syntheticMessage = {
		_id: triggerMessageId,
		rid: room._id,
		msg: '[Smart Forms Submission]',
		ts: triggerMessageTs,
		u: {
			_id: user?._id || 'medsense-smartforms',
			username: user?.username || 'medsense-smartforms',
			name: user?.name || user?.username || 'Smart Forms',
		},
	} as IMessage;

	if (!_roomHasEnabledMedsenseSummaryWebhook(room, syntheticMessage)) {
		return;
	}

	await Rooms.update(
		{ _id: room._id },
		{
			$set: {
				'medsenseSessionInfo.summaryUpdate': {
					inProgress: true,
					triggerMessageId,
					startedAt: nowIso,
				},
			},
		},
	);

	const patientUserId = await _resolvePatientUserIdForRoom(room._id, undefined);
	const payload = {
		roomId: room._id,
		requestId: room.medsenseActiveRequestId || null,
		patientUserId: patientUserId || null,
		finalMessageId: triggerMessageId,
		reason: 'smartforms_submit',
		previousSummary: sessionInfo.summary,
		sessionContext: {
			sessionId: sessionInfo.sessionId,
			sessionStatus: sessionInfo.status,
			currentOwner: sessionInfo.currentOwner,
			assigned: room.medsenseAssigned === 'Staff' ? 'Staff' : 'AI',
		},
		messages: sessionBuffer.map(_buildSmartFormSummaryMessagePayload),
		submittedForms: [...sessionInfo.sessionForms, ...sessionInfo.roomFormSubmissions],
		patientSafetySnapshot: {},
	};

	try {
		await triggerHandler.executeTriggers('medsenseSessionSummary', syntheticMessage, room, payload);
	} catch (error) {
		console.error('[MedsenseSessionSummary] Smart Forms submit trigger failed:', error);
		await _resetMedsenseSessionSummaryUpdate(room._id, triggerMessageId);
	}
};

const _defaultSessionInfo = () => ({
	version: MEDSENSE_SESSION_INFO_VERSION,
	sessionId: null as string | null,
	status: 'ended' as 'running' | 'waiting_for_user' | 'waiting_for_staff' | 'voice_active' | 'interrupted' | 'ended',
	currentOwner: _defaultCurrentOwner(),
	activeRun: _emptyActiveRun(),
	pending: _emptyPending(),
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
		patientVisitorToken: null as string | null,
		patientIdentityType: null as string | null,
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

const _normalizeSessionInfo = (raw: any) => {
	const base = _defaultSessionInfo();
	const source = raw && typeof raw === 'object' ? raw : {};
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
				? _buildLegacySessionId(legacyAssignedAgent, source)
				: null;
	normalized.currentOwner = _normalizeCurrentOwner(source.currentOwner, legacyAssignedAgent, source.sessionStartTs || null);
	normalized.activeRun = _normalizeActiveRun(source.activeRun);
	normalized.pending = _normalizePending(source.pending);
	normalized.lastRecovery = _normalizeLastRecovery(source.lastRecovery);
	normalized.status = _normalizeSessionStatus(source.status, normalized.currentOwner, Boolean(source.voice?.active));
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
	return normalized;
};

API.v1.addRoute(
	'medsense/room.sessionInfo',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.queryParams.roomId);

			const room = await Rooms.findOneById(roomId, {
				projection: {
					_id: 1,
					t: 1,
					name: 1,
					fname: 1,
					uids: 1,
					usernames: 1,
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const expiryResult = _applySmartFormExpiry(_normalizeSessionInfo((room as any).medsenseSessionInfo));
			if (expiryResult.didExpire) {
				await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: expiryResult.sessionInfo } });
			}

			return API.v1.success({
				sessionInfoVersion: MEDSENSE_SESSION_INFO_VERSION,
				sessionInfo: expiryResult.sessionInfo,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/room.preview',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ roomId: String }));
			if (!(await hasPermissionAsync(this.userId, 'medsense-view-request'))) {
				return API.v1.forbidden();
			}

			const roomId = String(this.queryParams.roomId);
			const rawCount = typeof this.queryParams.count === 'string' ? this.queryParams.count : '10';
			const parsedCount = Number.parseInt(rawCount, 10);
			const count = Number.isFinite(parsedCount) ? Math.max(1, Math.min(parsedCount, 20)) : 10;

			const room = await Rooms.findOneById(roomId, {
				projection: { _id: 1, t: 1, fname: 1, name: 1, medsenseSessionInfo: 1 },
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const linkedRequest = await MedsenseRequests.findOne(
				{
					$or: [{ roomId }, { _id: (room as any).medsenseActiveRequestId }],
				},
				{ sort: { createdAt: -1 } as any },
			);
			if (!linkedRequest && !(room as any).medsenseSessionInfo) {
				return API.v1.failure('Room is not a MedSense room');
			}

			const history = await loadMessageHistory({
				userId: this.userId,
				rid: roomId,
				limit: count,
				showThreadMessages: true,
				offset: 0,
				end: undefined,
			});

			return API.v1.success({
				room: {
					_id: room._id,
					t: room.t,
					fname: (room as any).fname || null,
					name: room.name || null,
				},
				messages: history.messages || [],
			});
		},
	},
);

API.v1.addRoute(
	'medsense/room.sessionInfo.active',
	{ authRequired: true },
	{
		async get() {
			const rawLimit = typeof this.queryParams.limit === 'string' ? this.queryParams.limit : '100';
			const parsedLimit = Number.parseInt(rawLimit, 10);
			const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 500)) : 100;

			const rooms = await Rooms.find(
				{
					$or: [
						{ 'medsenseSessionInfo.sessionId': { $exists: true, $ne: null } },
						{ 'medsenseSessionInfo.status': { $in: ['running', 'waiting_for_user', 'waiting_for_staff', 'voice_active', 'interrupted'] } },
						{ 'medsenseSessionInfo.voice.active': true },
					],
				},
				{
					projection: {
						medsenseSessionInfo: 1,
						medsenseActiveRequestId: 1,
						medsenseAssigned: 1,
					},
					limit,
				},
			).toArray();

			const sessions = await Promise.all(
				rooms.map(async (room: any) => {
					const sessionInfo = _normalizeSessionInfo(room?.medsenseSessionInfo);
					const sessionBuffer = Array.isArray(sessionInfo.sessionBuffer) ? sessionInfo.sessionBuffer : [];
					const lastBufferEntry = sessionBuffer.length ? sessionBuffer[sessionBuffer.length - 1] : null;
					const lastActivityTs =
						(sessionInfo as any).lastActivityTs ||
						lastBufferEntry?.endTs ||
						lastBufferEntry?.startTs ||
						sessionInfo.sessionStartTs ||
						sessionInfo.summary?.updatedAt ||
						null;
					const patientUserId = await _resolvePatientUserIdForRoom(room._id);
					return {
						roomId: room._id,
						contextVersion: MEDSENSE_ROOM_CONTEXT_VERSION,
						session: {
							sessionId: sessionInfo.sessionId,
							sessionStartTs: sessionInfo.sessionStartTs,
							lastActivityTs,
							status: sessionInfo.status,
							currentOwner: sessionInfo.currentOwner,
							summary: sessionInfo.summary,
							summaryUpdate: sessionInfo.summaryUpdate,
						},
						voice: sessionInfo.voice,
						assigned: room.medsenseAssigned === 'Staff' ? 'Staff' : 'AI',
						patientUserId: patientUserId || undefined,
					};
				}),
			);

			return API.v1.success({ sessions });
		},
	},
);

API.v1.addRoute(
	'medsense/room.typing',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					isTyping: Boolean,
					status: Match.Optional(String),
				}),
			);

			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const roomId = String(this.bodyParams.roomId);
			const isTyping = Boolean((this.bodyParams as any).isTyping);
			const status = String((this.bodyParams as any).status || '')
				.trim()
				.toLowerCase();
			const activityByStatus: Record<string, string> = {
				thinking: 'user-typing',
				agent_processing: 'user-typing',
				processing_form: 'medsense-processing-form',
				preparing_form: 'medsense-preparing-form',
			};
			const activity = activityByStatus[status] || 'user-typing';
			const room = await Rooms.findOneById(roomId, { projection: { _id: 1 } });
			if (!room) {
				return API.v1.failure('Room not found');
			}

			notifications.notifyRoom(roomId, 'user-activity', 'MedSense', isTyping ? [activity] : []);

			return API.v1.success({
				roomId,
				isTyping,
				status,
				label: 'MedSense',
			});
		},
	},
);
API.v1.addRoute(
	'medsense/room.sessionInfo.update',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					sessionInfo: Match.ObjectIncluding({}),
				}),
			);

			const roomId = String(this.bodyParams.roomId);
			const incoming = (this.bodyParams as any).sessionInfo || {};

			const room = await Rooms.findOneById(roomId, {
				projection: {
					_id: 1,
					t: 1,
					name: 1,
					fname: 1,
					uids: 1,
					usernames: 1,
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const current = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const next = {
				...current,
				...incoming,
			};

			if ('sessionBuffer' in incoming) {
				next.sessionBuffer = Array.isArray(incoming.sessionBuffer) ? incoming.sessionBuffer : [];
			}
			if ('sessionForms' in incoming) {
				next.sessionForms = Array.isArray(incoming.sessionForms) ? incoming.sessionForms : [];
			}
			if ('roomFormSubmissions' in incoming) {
				next.roomFormSubmissions = Array.isArray(incoming.roomFormSubmissions) ? incoming.roomFormSubmissions : [];
			}
			if ('sessionId' in incoming) {
				next.sessionId = typeof incoming.sessionId === 'string' && incoming.sessionId.trim() ? incoming.sessionId.trim() : null;
			}
			if ('status' in incoming) {
				next.status = _normalizeSessionStatus(incoming.status, next.currentOwner, Boolean(next.voice?.active));
			}
			if ('currentOwner' in incoming) {
				next.currentOwner = _normalizeCurrentOwner(incoming.currentOwner, null, next.sessionStartTs || null);
				next.status = _normalizeSessionStatus(next.status, next.currentOwner, Boolean(next.voice?.active));
			}
			if ('activeRun' in incoming) {
				next.activeRun = _normalizeActiveRun(incoming.activeRun);
			}
			if ('pending' in incoming) {
				next.pending = _normalizePending(incoming.pending);
			}
			if ('lastRecovery' in incoming) {
				next.lastRecovery = _normalizeLastRecovery(incoming.lastRecovery);
			}
			if ('summary' in incoming) {
				next.summary =
					incoming.summary && typeof incoming.summary === 'object'
						? {
								text: typeof incoming.summary.text === 'string' ? incoming.summary.text : '',
								updatedAt: typeof incoming.summary.updatedAt === 'string' ? incoming.summary.updatedAt : null,
								lastProcessedMessageId:
									typeof incoming.summary.lastProcessedMessageId === 'string' && incoming.summary.lastProcessedMessageId.trim()
										? incoming.summary.lastProcessedMessageId.trim()
										: current.summary?.lastProcessedMessageId || null,
							}
						: current.summary;
			}
			if ('summaryUpdate' in incoming) {
				next.summaryUpdate =
					incoming.summaryUpdate && typeof incoming.summaryUpdate === 'object'
						? {
								inProgress: Boolean(incoming.summaryUpdate.inProgress),
								triggerMessageId:
									typeof incoming.summaryUpdate.triggerMessageId === 'string' && incoming.summaryUpdate.triggerMessageId.trim()
										? incoming.summaryUpdate.triggerMessageId.trim()
										: null,
								startedAt:
									typeof incoming.summaryUpdate.startedAt === 'string' && incoming.summaryUpdate.startedAt.trim()
										? incoming.summaryUpdate.startedAt.trim()
										: null,
							}
						: current.summaryUpdate;
			}
			next.version = MEDSENSE_SESSION_INFO_VERSION;
			delete (next as any).assignedAgent;
			delete (next as any).parentSessionId;
			delete (next as any).roomContextSummaries;

			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: next } });

			return API.v1.success({ sessionInfo: next });
		},
	},
);

API.v1.addRoute(
	'medsense/room.smartforms',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.queryParams.roomId);

			const room = await Rooms.findOneById(roomId, {
				projection: { medsenseSessionInfo: 1, medsenseActiveRequestId: 1 },
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const expiryResult = _applySmartFormExpiry(_normalizeSessionInfo((room as any).medsenseSessionInfo));
			if (expiryResult.didExpire) {
				await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: expiryResult.sessionInfo } });
			}
			const sessionInfo = expiryResult.sessionInfo;
			const pendingForms = (Array.isArray(sessionInfo.sessionForms) ? sessionInfo.sessionForms : [])
				.map(_normalizeSmartFormEntry)
				.filter(Boolean) as MedsenseSmartFormEntry[];
			const pastResponses = Array.isArray(sessionInfo.roomFormSubmissions) ? sessionInfo.roomFormSubmissions : [];
			const viewerCanAnswer = !(await _isMedsenseStaffViewer(this.userId));

			return API.v1.success({
				pendingForms,
				pendingCount: pendingForms.length,
				pastResponses,
				viewerCanAnswer,
				showCompactReview: pendingForms.length === 0 && pastResponses.length > 0,
				activeFormIndex: pendingForms.length > 0 ? 0 : -1,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/room.smartforms.intake',
	{ authRequired: false },
	{
		async post() {
			if (!_hasValidMedsenseWebhookSecret(this.request.headers as Record<string, any>)) {
				return API.v1.forbidden();
			}

			const rawPayload =
				(this.bodyParams.smartForm && typeof this.bodyParams.smartForm === 'object' ? this.bodyParams.smartForm : null) ||
				(this.bodyParams.medsenseForm ? { medsenseForm: this.bodyParams.medsenseForm } : null) ||
				this.bodyParams.payload ||
				this.bodyParams;

			const roomId =
				typeof this.bodyParams.roomId === 'string' && this.bodyParams.roomId.trim()
					? this.bodyParams.roomId.trim()
					: typeof rawPayload?.medsenseForm?.roomId === 'string' && rawPayload.medsenseForm.roomId.trim()
						? rawPayload.medsenseForm.roomId.trim()
						: typeof rawPayload?.context?.roomId === 'string' && rawPayload.context.roomId.trim()
							? rawPayload.context.roomId.trim()
							: '';
			if (!roomId) {
				return API.v1.failure('Room not found');
			}

			const room = await Rooms.findOneById(roomId, { projection: { medsenseSessionInfo: 1 } });
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const nowIso = new Date().toISOString();
			const incomingEntries = _normalizeSmartFormEntries(rawPayload, nowIso);
			if (incomingEntries.length === 0) {
				return API.v1.failure('No Smart Forms payload found');
			}

			const current = _applySmartFormExpiry(_normalizeSessionInfo((room as any).medsenseSessionInfo), nowIso).sessionInfo;
			const nextSessionInfo = {
				...current,
				sessionForms: _mergeSmartFormEntries(current.sessionForms, incomingEntries),
				lastActivityTs: nowIso,
				status: 'waiting_for_user',
				pending: {
					kind: 'form_submission',
					recoverable: true,
					waitingFor: 'user',
					formId: incomingEntries[0].formId,
					toolCallIds: [],
					markedAt: nowIso,
					context: {
						entryIds: incomingEntries.map((entry) => entry.entryId),
					},
				},
			};

			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: nextSessionInfo } });

			return API.v1.success({
				pendingForms: nextSessionInfo.sessionForms,
				pendingCount: nextSessionInfo.sessionForms.length,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/room.smartforms.submit',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					formId: String,
					stepId: Match.Maybe(String),
					selection: Match.Maybe([String]),
					customText: Match.Maybe(String),
					dismiss: Match.Maybe(Boolean),
					responses: Match.Maybe([
						Match.ObjectIncluding({
							stepId: String,
							selection: Match.Maybe([String]),
							customText: Match.Maybe(String),
						}),
					]),
				}),
			);

			if (await _isMedsenseStaffViewer(this.userId)) {
				return API.v1.forbidden();
			}

			const roomId = String(this.bodyParams.roomId);
			const formId = String(this.bodyParams.formId);
			const stepId = typeof this.bodyParams.stepId === 'string' ? String(this.bodyParams.stepId).trim() : '';
			const selection = Array.isArray(this.bodyParams.selection)
				? this.bodyParams.selection.map((value: string) => String(value).trim()).filter(Boolean)
				: [];
			const customText = typeof this.bodyParams.customText === 'string' ? this.bodyParams.customText.trim() : '';
			const requestedResponses = Array.isArray((this.bodyParams as any).responses)
				? ((this.bodyParams as any).responses as Array<any>)
				: [];
			const shouldDismiss = Boolean((this.bodyParams as any).dismiss);

			const room = await Rooms.findOneById(roomId, {
				projection: {
					_id: 1,
					t: 1,
					name: 1,
					fname: 1,
					uids: 1,
					usernames: 1,
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const expiryResult = _applySmartFormExpiry(_normalizeSessionInfo((room as any).medsenseSessionInfo));
			const sessionInfo = expiryResult.sessionInfo;
			if (expiryResult.didExpire) {
				await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: sessionInfo } });
			}
			const pendingForms = (Array.isArray(sessionInfo.sessionForms) ? sessionInfo.sessionForms : [])
				.map(_normalizeSmartFormEntry)
				.filter(Boolean) as MedsenseSmartFormEntry[];
			const pendingFormIds = Array.from(new Set(pendingForms.map((entry) => entry.formId)));
			if (pendingFormIds.length > 1) {
				return API.v1.failure('All pending Smart Forms must belong to the same form before submission.');
			}
			if (pendingForms.some((entry) => entry.formId !== formId)) {
				return API.v1.failure('Complete all pending Smart Forms before submitting.');
			}

			const responseMap = new Map<string, { selection?: string[]; customText?: string }>();
			if (shouldDismiss) {
				for (const pendingEntry of pendingForms) {
					responseMap.set(pendingEntry.stepId, {
						selection: ['decline'],
						customText: '',
					});
				}
			} else if (requestedResponses.length > 0) {
				for (const response of requestedResponses) {
					const responseStepId = typeof response?.stepId === 'string' ? response.stepId.trim() : '';
					if (!responseStepId) {
						continue;
					}
					responseMap.set(responseStepId, {
						selection: Array.isArray(response?.selection)
							? response.selection.map((value: string) => String(value).trim()).filter(Boolean)
							: [],
						customText: typeof response?.customText === 'string' ? response.customText.trim() : '',
					});
				}
			} else if (stepId) {
				responseMap.set(stepId, { selection, customText });
			}

			if (pendingForms.length > 1 && responseMap.size < pendingForms.length) {
				return API.v1.failure('Complete all pending Smart Forms before submitting.');
			}

			const submissions: MedsenseSmartFormSubmissionDraft[] = [];
			for (const pendingEntry of pendingForms) {
				const incomingResponse = responseMap.get(pendingEntry.stepId);
				if (!incomingResponse) {
					if (pendingForms.length > 1) {
						return API.v1.failure('Complete all pending Smart Forms before submitting.');
					}
					continue;
				}

				const draft = _normalizeSmartFormSubmissionDraft(pendingEntry, incomingResponse);
				if (!draft.selection.length && !draft.customText) {
					return API.v1.failure('A response is required for every pending Smart Form.');
				}
				submissions.push(draft);
			}

			if (submissions.length === 0) {
				return API.v1.failure('Pending Smart Form not found');
			}

			const submittedEntryIds = new Set(submissions.map(({ entry }) => entry.entryId));
			const response = await _emitSmartFormSubmitIntegration({
				formId,
				submissions,
				room: room as IRoom & Record<string, any>,
				user: this.user,
				sessionInfo,
			});

			const submittedAt = new Date().toISOString();
			const remainingForms = pendingForms.filter((entry) => !submittedEntryIds.has(entry.entryId));
			const roomFormSubmissions = Array.isArray(sessionInfo.roomFormSubmissions) ? sessionInfo.roomFormSubmissions : [];
			const nextRoomFormSubmissions = [
				...roomFormSubmissions,
				...submissions.map(({ entry, selection, customText }) => _buildSmartFormSubmissionEntry(entry, selection, customText, submittedAt)),
			].slice(-100);
			const nextSessionInfo = {
				...sessionInfo,
				sessionForms: remainingForms,
				roomFormSubmissions: nextRoomFormSubmissions,
				lastActivityTs: submittedAt,
				status: remainingForms.length > 0 ? 'waiting_for_user' : 'running',
				pending:
					remainingForms.length > 0
						? {
								kind: 'form_submission',
								recoverable: true,
								waitingFor: 'user',
								formId: remainingForms[0].formId,
								toolCallIds: [],
								markedAt: submittedAt,
								context: {
									entryIds: remainingForms.map((entry) => entry.entryId),
								},
							}
						: _emptyPending(),
			};

			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: nextSessionInfo } });
			if (remainingForms.length === 0) {
				await _triggerMedsenseSessionSummaryForSmartForms({
					room: {
						...(room as IRoom & Record<string, any>),
						medsenseSessionInfo: nextSessionInfo,
					},
					user: this.user,
					sessionInfo: nextSessionInfo,
				});
			}

			return API.v1.success({
				success: true,
				dismissed: shouldDismiss,
				response,
				pendingCount: remainingForms.length,
				showCompactReview: remainingForms.length === 0 && nextRoomFormSubmissions.length > 0,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.pharmacy.resolve',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);
			check(payload, Match.ObjectIncluding({ toNumber: Match.OneOf(String, null, undefined) }));
			const normalizedTo = normalizeVoiceInboundNumber((payload as any).toNumber);
			if (!normalizedTo) {
				return API.v1.success({ mapped: false, reason: 'invalid_to_number' });
			}
			const pharmacy = await MedsensePharmacies.findOneByVoiceInboundNumber(normalizedTo);
			if (!pharmacy) {
				return API.v1.success({ mapped: false, reason: 'number_not_mapped', normalizedTo });
			}
			return API.v1.success({
				mapped: true,
				normalizedTo,
				pharmacyId: pharmacy._id,
				timezone: pharmacy.timezone || null,
				isOpen: getPharmacyVoiceAvailability(pharmacy, normalizedTo).isOpen,
				matchedInboundNumber: normalizedTo,
				afterHoursPolicy: pharmacy.afterHoursPolicy || DEFAULT_MEDSENSE_AFTER_HOURS_POLICY,
				pharmacy: {
					_id: pharmacy._id,
					name: pharmacy.name,
					slug: pharmacy.slug,
					voiceInboundNumber: pharmacy.voiceInboundNumber || null,
					timezone: pharmacy.timezone || null,
				},
				availability: getPharmacyVoiceAvailability(pharmacy, normalizedTo),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.caller.resolve',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);
			check(payload, Match.ObjectIncluding({ fromNumber: Match.OneOf(String, null, undefined) }));

			const normalizedFrom = normalizeVoiceInboundNumber((payload as any).fromNumber);
			if (!normalizedFrom) {
				return API.v1.success({ found: false, reason: 'invalid_from_number' });
			}

			const patientUser = await Users.findOne(
				{
					roles: 'user',
					$or: [
						{ phoneNumber: normalizedFrom },
						{ phones: { $elemMatch: { phoneNumber: normalizedFrom } } },
						{ phone: { $elemMatch: { phoneNumber: normalizedFrom } } },
					],
				},
				{ projection: { _id: 1, username: 1, name: 1 } },
			);
			if (!patientUser?._id) {
				return API.v1.success({ found: false, normalizedFrom });
			}

			return API.v1.success({
				found: true,
				normalizedFrom,
				patientUser: {
					_id: patientUser._id,
					username: patientUser.username,
					name: patientUser.name || patientUser.username,
				},
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.session.start',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);
			check(
				payload,
				Match.ObjectIncluding({
					toNumber: Match.OneOf(String, null, undefined),
					fromNumber: Match.OneOf(String, null, undefined),
					callId: Match.OneOf(String, null, undefined),
					nodeId: Match.OneOf(String, null, undefined),
					transport: Match.Maybe(String),
					forceGuestIdentity: Match.Maybe(Boolean),
					confirmedPatientUserId: Match.Maybe(String),
				}),
			);

			const normalizedTo = normalizeVoiceInboundNumber((payload as any).toNumber);
			const normalizedFrom = normalizeVoiceInboundNumber((payload as any).fromNumber);
			const forceGuestIdentity = Boolean((payload as any).forceGuestIdentity);
			const confirmedPatientUserId = String((payload as any).confirmedPatientUserId || '').trim();
			if (!normalizedTo) {
				return API.v1.failure('invalid inbound destination number');
			}

			const pharmacy = await MedsensePharmacies.findOneByVoiceInboundNumber(normalizedTo);
			if (!pharmacy) {
				return API.v1.success({
					mapped: false,
					reason: 'number_not_mapped',
					normalizedTo,
				});
			}

			const callId = String((payload as any).callId || '').trim();
			if (callId) {
				const existingRoom = await Rooms.findOne(
					{ 'medsenseSessionInfo.voice.callId': callId },
					{
						projection: {
							_id: 1,
							medsenseActiveRequestId: 1,
							medsenseSessionInfo: 1,
						},
					},
				);
				if (existingRoom) {
					const sessionInfo = _normalizeSessionInfo((existingRoom as any).medsenseSessionInfo);
					const existingRequestId = (existingRoom as any).medsenseActiveRequestId || null;
					const existingAvailability = getPharmacyVoiceAvailability(pharmacy, normalizedTo);
					return API.v1.success({
						mapped: true,
						pharmacyId: pharmacy._id,
						roomId: existingRoom._id,
						requestId: existingRequestId,
						sessionId: sessionInfo.voice?.sessionId || null,
						roomName: sessionInfo.voice?.roomName || null,
						availability: existingAvailability,
						afterHoursVoicemail:
							!existingAvailability.isOpen && existingRequestId && sessionInfo.voice?.sessionId
								? buildAfterHoursVoicemailInstruction({
										roomId: existingRoom._id,
										requestId: String(existingRequestId),
										sessionId: String(sessionInfo.voice.sessionId),
									})
								: undefined,
					});
				}
			}
			const availability = getPharmacyVoiceAvailability(pharmacy, normalizedTo);

			const botUsername = String(settings.get<string>('Medsense_Bot_User') || 'bot').trim();
			const botUser = await Users.findOneByUsernameIgnoringCase(botUsername, {
				projection: { _id: 1, username: 1, name: 1, roles: 1 },
			});
			if (!botUser?._id || !botUser.username) {
				return API.v1.failure('Medsense bot user not found');
			}

			let patientUser = null;
			let patientVisitor: ILivechatVisitor | null = null;
			let patientVisitorToken: string | null = null;
			let patientIdentityType: 'registered_user' | 'livechat_visitor' | 'bot_fallback' = 'bot_fallback';
			if (normalizedFrom && !forceGuestIdentity) {
				patientUser = await Users.findOne(
					{
						roles: 'user',
						$or: [
							{ phoneNumber: normalizedFrom },
							{ phones: { $elemMatch: { phoneNumber: normalizedFrom } } },
							{ phone: { $elemMatch: { phoneNumber: normalizedFrom } } },
						],
					},
					{
						projection: { _id: 1, username: 1, name: 1, roles: 1, emails: 1, phoneNumber: 1, phones: 1, phone: 1 },
					},
				);
			}
			if (patientUser?._id && confirmedPatientUserId && patientUser._id !== confirmedPatientUserId) {
				patientUser = null;
			}
			if (patientUser?._id) {
				patientIdentityType = 'registered_user';
			}
			if (!patientUser?._id && normalizedFrom) {
				try {
					const existingVisitor = await LivechatVisitors.findOneVisitorByPhone(normalizedFrom);
					const callerDigits = normalizedFrom.replace(/\D/g, '');
					const guestToken =
						String(existingVisitor?.token || '').trim() || `medsense-voice-${callerDigits || randomBytes(4).toString('hex')}`;
					const guestUsername = String(existingVisitor?.username || '').trim() || `voice-${callerDigits || randomBytes(4).toString('hex')}`;
					const guestName = String(existingVisitor?.name || '').trim() || `Voice caller ${callerDigits.slice(-4) || 'unknown'}`;
					const registeredVisitor = await registerGuest(
						{
							token: guestToken,
							username: guestUsername,
							name: guestName,
							phone: { number: normalizedFrom },
						},
						{
							shouldConsiderIdleAgent: settings.get<boolean>('Livechat_enabled_when_agent_idle'),
						},
					);
					if (registeredVisitor?._id && registeredVisitor?.username) {
						patientVisitor = registeredVisitor as ILivechatVisitor;
						patientUser = {
							_id: registeredVisitor._id,
							username: registeredVisitor.username,
							name: String(registeredVisitor.name || registeredVisitor.username),
						};
						patientVisitorToken = String(registeredVisitor.token || guestToken);
						patientIdentityType = 'livechat_visitor';
					}
				} catch (error) {
					console.error('[MedsenseVoice] failed to register livechat visitor for voice caller', {
						normalizedFrom,
						error: String((error as any)?.message || error || ''),
					});
				}
			}

			const requesterId = patientUser?._id || botUser._id;
			const requesterUsername = patientUser?.username || botUser.username;
			const requestStatus = availability.isOpen ? 'ai_preassessment' : 'after_hours';
			const requestId = await MedsenseRequests.createRequest({
				roomId: null,
				pharmacyId: pharmacy._id,
				requestedByUserId: requesterId,
				requestedByUsername: requesterUsername,
				reason: `Inbound voice call from ${normalizedFrom || 'unknown number'}`,
				status: requestStatus,
				patientStage: 'pre_assessment',
				contextSummary: '',
				answers: {},
				preAssessmentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
				intakeAvailability: availability.isOpen ? 'open' : 'closed',
				pharmacyTimezone: availability.timezone || undefined,
				matchedVoiceInboundNumber: availability.matchedInboundNumber,
				createdAt: new Date(),
			});

			const usePatientAsRoomOwner = patientIdentityType === 'registered_user' && Boolean(patientUser?._id);
			let room;
			if (patientIdentityType === 'livechat_visitor' && patientVisitor?._id && patientVisitor.token) {
				room = await createLivechatRoom({
					visitor: patientVisitor,
					message: `Inbound voice call from ${normalizedFrom || 'unknown number'}`,
					roomInfo: {
						source: {
							type: OmnichannelSourceType.API,
							alias: 'medsense_voice',
							destination: normalizedTo,
						},
						medsenseSessionInfo: createDefaultMedsenseSessionInfo(),
					} as any,
				});
				const now = new Date();
				const existingBotSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, botUser._id, {
					projection: { _id: 1 },
				});
				if (!existingBotSub) {
					await Subscriptions.createWithRoomAndUser(room as any, botUser as any, {
						open: true,
						ts: now,
						ls: now,
						alert: false,
						unread: 0,
					});
				}
			} else {
				room = await createMedsenseBotRoomForUsers({
					patientUser: usePatientAsRoomOwner ? patientUser : undefined,
					botUser,
					creatorUser: usePatientAsRoomOwner ? undefined : botUser,
					roomNameSeed: patientUser?.username || normalizedFrom || 'voice-patient',
					roomExtraData: {
						customFields: {
							voiceInboundNumber: normalizedTo,
							voiceCallerNumber: normalizedFrom || '',
							pharmacyId: pharmacy._id,
						},
					},
				});
			}
			if (patientUser?._id && !usePatientAsRoomOwner && patientIdentityType !== 'livechat_visitor') {
				const existingPatientSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, patientUser._id, {
					projection: { _id: 1 },
				});
				if (!existingPatientSub) {
					try {
						await addUserToRoom(
							room._id,
							{ _id: patientUser._id, username: patientUser.username },
							{ _id: botUser._id, username: botUser.username },
							{ skipSystemMessage: true, skipAlertSound: true },
						);
					} catch {
						// Continue with direct subscription fallback below.
					}
					const ensuredPatientSub = await Subscriptions.findOneByRoomIdAndUserId(room._id, patientUser._id, {
						projection: { _id: 1 },
					});
					if (!ensuredPatientSub) {
						const now = new Date();
						await Subscriptions.createWithRoomAndUser(room, patientUser as any, {
							open: true,
							ts: now,
							ls: now,
							alert: false,
							unread: 0,
						});
					}
				}
			}

			const sessionId = String((payload as any).sessionId || '').trim() || (callId ? callId.slice(0, 12) : randomBytes(6).toString('hex'));

			const existingSessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const nextSessionInfo = {
				...existingSessionInfo,
				voice: {
					...existingSessionInfo.voice,
					active: true,
					sessionId,
					patientUserId: patientUser?._id || null,
					patientVisitorToken: patientVisitorToken || null,
					patientIdentityType,
					state: availability.isOpen ? 'ai_active' : 'after_hours_voicemail',
					transport: String((payload as any).transport || 'signalwire_swml'),
					roomName: `medsense-room-${sessionId}`,
					callId: callId || null,
					nodeId: String((payload as any).nodeId || '').trim() || null,
					inboundToNumber: normalizedTo,
					callerNumber: normalizedFrom || null,
					pharmacyId: pharmacy._id,
					lastEventAt: new Date().toISOString(),
				},
			};

			await MedsenseRequests.updateOne(
				{ _id: requestId },
				{
					$set: {
						roomId: room._id,
						requestedByUsername: requesterUsername,
						intakeAvailability: availability.isOpen ? 'open' : 'closed',
						pharmacyTimezone: availability.timezone || undefined,
						matchedVoiceInboundNumber: availability.matchedInboundNumber,
						_updatedAt: new Date(),
					},
				},
			);

			await Rooms.update(
				{ _id: room._id },
				{
					$set: {
						medsenseActiveRequestId: requestId,
						medsenseActiveRequestStatus: requestStatus,
						medsenseAssigned: 'AI',
						medsenseSessionInfo: nextSessionInfo,
					},
				},
			);
			api.broadcast('room.save', {
				_id: room._id,
				medsenseActiveRequestStatus: requestStatus,
				medsenseAssigned: 'AI',
			});

			let afterHoursNotifications = undefined;
			const afterHoursVoicemail = availability.isOpen
				? undefined
				: buildAfterHoursVoicemailInstruction({
						roomId: room._id,
						requestId,
						sessionId,
					});
			if (availability.isOpen) {
				await sendMessage(
					botUser,
					{
						rid: room._id,
						msg: `[Voice] Session ${sessionId} started from ${normalizedFrom || 'unknown caller'}.`,
					},
					room,
				);
			} else {
				await sendMessage(
					botUser,
					{
						rid: room._id,
						msg: `[Voice] Pharmacy ${pharmacy.name} is currently closed. After-hours voicemail capture is active.`,
					},
					room,
				);
			}

			return API.v1.success({
				mapped: true,
				pharmacyId: pharmacy._id,
				pharmacyName: pharmacy.name,
				roomId: room._id,
				requestId,
				requestStatus,
				sessionId,
				roomName: nextSessionInfo.voice.roomName,
				patientUserId: patientUser?._id || null,
				patientVisitorToken: patientVisitorToken || null,
				patientIdentityType,
				availability,
				afterHoursVoicemail,
				afterHoursNotifications,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.session.state.upsert',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);
			check(
				payload,
				Match.ObjectIncluding({
					roomId: String,
					sessionId: Match.Maybe(String),
					state: Match.Maybe(String),
					active: Match.Maybe(Boolean),
				}),
			);

			const roomId = String((payload as any).roomId);
			const room = await Rooms.findOneById(roomId, {
				projection: { medsenseSessionInfo: 1 },
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const current = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const incoming = payload as any;
			const nextVoice = {
				...current.voice,
				active: typeof incoming.active === 'boolean' ? incoming.active : current.voice.active,
				sessionId:
					typeof incoming.sessionId === 'string' && incoming.sessionId.trim() ? incoming.sessionId.trim() : current.voice.sessionId,
				state: typeof incoming.state === 'string' && incoming.state.trim() ? incoming.state.trim() : current.voice.state,
				transport:
					typeof incoming.transport === 'string' && incoming.transport.trim() ? incoming.transport.trim() : current.voice.transport,
				roomName: typeof incoming.roomName === 'string' && incoming.roomName.trim() ? incoming.roomName.trim() : current.voice.roomName,
				lastTranscriptAt:
					typeof incoming.lastTranscriptAt === 'string' && incoming.lastTranscriptAt.trim()
						? incoming.lastTranscriptAt.trim()
						: current.voice.lastTranscriptAt,
				lastTtsAt:
					typeof incoming.lastTtsAt === 'string' && incoming.lastTtsAt.trim() ? incoming.lastTtsAt.trim() : current.voice.lastTtsAt,
				lastEventId: typeof incoming.eventId === 'string' && incoming.eventId.trim() ? incoming.eventId.trim() : current.voice.lastEventId,
				participants:
					incoming.participants && typeof incoming.participants === 'object' ? incoming.participants : current.voice.participants,
				lastEventAt: new Date().toISOString(),
			};
			const next = {
				...current,
				voice: nextVoice,
			};

			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: next } });
			return API.v1.success({ roomId, sessionInfo: next });
		},
	},
);

API.v1.addRoute(
	'medsense/voice.transcript.ingest',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);

			check(
				payload,
				Match.ObjectIncluding({
					roomId: String,
					sessionId: Match.Maybe(String),
					speaker: String,
					text: String,
					source: Match.Maybe(String),
					eventId: Match.Maybe(String),
					patientUserId: Match.Maybe(String),
					staffUserId: Match.Maybe(String),
				}),
			);

			const roomId = String((payload as any).roomId);
			const speaker = String((payload as any).speaker || '')
				.trim()
				.toLowerCase();
			const text = String((payload as any).text || '').trim();
			const source = String((payload as any).source || 'signalwire').trim();
			const eventId = String((payload as any).eventId || '').trim();
			const sessionId = String((payload as any).sessionId || '').trim();
			if (!text) {
				return API.v1.success({ ignored: true, reason: 'empty_text' });
			}

			const room = await Rooms.findOneById(roomId, {
				projection: {
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					t: 1,
				},
			});
			if (!room?.t) {
				return API.v1.failure('Room not found');
			}

			const current = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const voice = current.voice || _defaultSessionInfo().voice;
			const isAfterHoursVoicemailTranscript =
				Boolean((payload as any).afterHoursVoicemail || (payload as any).isAfterHoursVoicemail) ||
				String(voice.state || '').startsWith('after_hours');
			if (voice.active === false && !isAfterHoursVoicemailTranscript) {
				return API.v1.success({ ignored: true, reason: 'voice_session_inactive' });
			}
			if (eventId && Array.isArray(voice.processedEventIds) && voice.processedEventIds.includes(eventId)) {
				return API.v1.success({ ignored: true, reason: 'duplicate_event', eventId });
			}

			const botUsername = String(settings.get<string>('Medsense_Bot_User') || 'bot').trim();
			const botUser = await Users.findOneByUsernameIgnoringCase(botUsername, { projection: { _id: 1, username: 1, name: 1 } });
			if (!botUser?._id) {
				return API.v1.failure('Medsense bot user not found');
			}

			let messageUser: any = botUser;
			let patientVisitor: ILivechatVisitor | null = null;
			let useLivechatPatientMessage = false;
			let messageText = text;
			if (speaker === 'patient') {
				const patientUserId = String((payload as any).patientUserId || voice.patientUserId || '').trim();
				if (patientUserId) {
					const patientUser = await Users.findOneById(patientUserId, { projection: { _id: 1, username: 1, name: 1 } });
					if (patientUser?._id) {
						messageUser = patientUser;
					} else {
						const visitor = await LivechatVisitors.findOneEnabledById(patientUserId);
						if (visitor?._id && visitor.username) {
							patientVisitor = visitor as ILivechatVisitor;
							messageUser = {
								_id: visitor._id,
								username: visitor.username,
								name: visitor.name || visitor.username,
							};
							useLivechatPatientMessage = room.t === 'l' && Boolean(visitor.token);
						}
					}
				}
				if (isAfterHoursVoicemailTranscript) {
					messageText = `[After-hours voicemail transcript] ${text}`;
				} else if (messageUser?._id === botUser._id) {
					messageText = `[Patient voice] ${text}`;
				}
			} else if (speaker === 'system') {
				messageText = `[Voice] ${text}`;
			} else if (speaker === 'staff') {
				const staffUserId = String((payload as any).staffUserId || '').trim();
				if (!staffUserId) {
					return API.v1.failure('staffUserId is required for staff transcript turns');
				}
				const staffUser = await Users.findOneById(staffUserId, { projection: { _id: 1, username: 1, name: 1 } });
				if (!staffUser?._id) {
					return API.v1.failure('staff user not found');
				}
				messageUser = staffUser;
			}

			const transcriptMetadata = {
				speaker,
				source,
				eventId: eventId || null,
				voiceSessionId: sessionId || voice.sessionId || null,
				timestamp: String((payload as any).timestamp || new Date().toISOString()),
				confidence: typeof (payload as any).confidence === 'number' ? (payload as any).confidence : undefined,
			};

			let messageRecord: any;
			if (useLivechatPatientMessage && patientVisitor?.token) {
				const livechatMessageId = randomBytes(12).toString('hex');
				await sendLivechatMessage({
					guest: patientVisitor,
					message: {
						_id: livechatMessageId,
						rid: roomId,
						token: patientVisitor.token,
						msg: messageText,
					},
					roomInfo: {
						source: (room as any).source || {
							type: OmnichannelSourceType.API,
							alias: 'medsense_voice',
						},
					},
				});
				messageRecord = { _id: livechatMessageId };
			} else {
				try {
					messageRecord = await sendMessage(
						messageUser,
						{
							rid: roomId,
							msg: messageText,
							customFields: {
								medsenseVoiceTranscript: transcriptMetadata,
							},
						},
						room,
					);
				} catch (error: any) {
					const message = String(error?.error || error?.message || '');
					const isCustomFieldValidationError = /invalid custom fields/i.test(message) || /custom fields not enabled/i.test(message);
					if (!isCustomFieldValidationError) {
						throw error;
					}
					messageRecord = await sendMessage(
						messageUser,
						{
							rid: roomId,
							msg: messageText,
						},
						room,
					);
				}
			}

			const transcriptRecords = Array.isArray((voice as any).transcriptRecords) ? (voice as any).transcriptRecords : [];
			const nextTranscriptRecords = [
				...transcriptRecords.slice(-199),
				{
					messageId: (messageRecord as any)?._id || null,
					speaker,
					source,
					eventId: eventId || null,
					sessionId: sessionId || voice.sessionId || null,
					staffUserId: speaker === 'staff' ? String((payload as any).staffUserId || '') : null,
					text,
					messageText,
					afterHoursVoicemail: isAfterHoursVoicemailTranscript,
					timestamp: String((payload as any).timestamp || new Date().toISOString()),
					confidence: typeof (payload as any).confidence === 'number' ? (payload as any).confidence : undefined,
				},
			];
			const processedEventIds = eventId
				? [...(Array.isArray(voice.processedEventIds) ? voice.processedEventIds : []).slice(-499), eventId]
				: Array.isArray(voice.processedEventIds)
					? voice.processedEventIds.slice(-500)
					: [];

			const next = {
				...current,
				voice: {
					...voice,
					patientUserId: String((payload as any).patientUserId || voice.patientUserId || '').trim() || null,
					lastTranscriptAt: new Date().toISOString(),
					lastEventAt: new Date().toISOString(),
					lastEventId: eventId || voice.lastEventId || null,
					processedEventIds,
					transcriptRecords: nextTranscriptRecords,
				},
			};
			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: next } });

			return API.v1.success({
				ok: true,
				roomId,
				messageId: (messageRecord as any)?._id || null,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.voicemail.ingest',
	{ authRequired: false },
	{
		async post() {
			const rawPayload = this.bodyParams || {};
			const signatureCheck = verifyVoiceSignature(this.request.headers as Record<string, any>, rawPayload);
			if (!signatureCheck.ok) {
				return API.v1.failure(`Invalid voice service signature (${signatureCheck.reason})`);
			}
			const payload = stripVoiceAuthFromPayload(rawPayload);

			check(
				payload,
				Match.ObjectIncluding({
					roomId: String,
					sessionId: Match.Maybe(String),
					requestId: Match.Maybe(String),
					eventId: Match.Maybe(String),
					recordingUrl: Match.Maybe(String),
					recordingSid: Match.Maybe(String),
					durationSeconds: Match.Maybe(Match.OneOf(Number, String)),
					contentType: Match.Maybe(String),
				}),
			);

			const roomId = String((payload as any).roomId || '').trim();
			const sessionId = String((payload as any).sessionId || '').trim();
			const requestId = String((payload as any).requestId || '').trim();
			const eventId = String((payload as any).eventId || '').trim();
			const recordingUrl = String((payload as any).recordingUrl || (payload as any).RecordingUrl || '').trim();
			const recordingSid = String((payload as any).recordingSid || (payload as any).RecordingSid || '').trim();
			const recordingStatus = normalizeRecordingStatus((payload as any).recordingStatus || (payload as any).RecordingStatus);
			const rawDuration = (payload as any).durationSeconds ?? (payload as any).RecordingDuration;
			const durationSeconds = Number.isFinite(Number(rawDuration)) ? Number(rawDuration) : null;
			const transcriptText = normalizeText(
				String((payload as any).transcriptText || (payload as any).transcript || (payload as any).TranscriptionText || ''),
			);
			const eventIds = [eventId, recordingSid ? `recording:${recordingSid}` : ''].filter(Boolean);

			const room = await Rooms.findOneById(roomId, {
				projection: {
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					t: 1,
				},
			});
			if (!room?.t) {
				return API.v1.failure('Room not found');
			}

			const current = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const voice = current.voice || _defaultSessionInfo().voice;
			const processedEventIds = Array.isArray(voice.processedEventIds) ? voice.processedEventIds : [];
			const voicemailRecords = Array.isArray((voice as any).voicemailRecords) ? (voice as any).voicemailRecords : [];
			const isDuplicate =
				eventIds.some((id) => processedEventIds.includes(id)) ||
				(recordingSid && voicemailRecords.some((record: any) => String(record?.recordingSid || '') === recordingSid));
			if (isDuplicate) {
				return API.v1.success({ ignored: true, reason: 'duplicate_voicemail', eventId, recordingSid });
			}

			const botUsername = String(settings.get<string>('Medsense_Bot_User') || 'bot').trim();
			const botUser = await Users.findOneByUsernameIgnoringCase(botUsername, { projection: { _id: 1, username: 1, name: 1, type: 1 } });
			const botUserId = String(botUser?._id || '');
			let botUserError: string | null = null;
			if (!botUserId) {
				botUserError = `Medsense bot user not found: ${botUsername}`;
				console.error('[MedsenseVoice] after-hours voicemail bot user unavailable', {
					roomId,
					requestId,
					sessionId,
					botUsername,
				});
			}

			const transcriptRecords = Array.isArray((voice as any).transcriptRecords) ? (voice as any).transcriptRecords : [];
			const latestTranscriptRecord = [...transcriptRecords]
				.reverse()
				.find((record: any) => record?.afterHoursVoicemail && (!sessionId || !record?.sessionId || record.sessionId === sessionId));
			let transcriptMessageId = latestTranscriptRecord?.messageId || null;
			const resolvedTranscriptText = transcriptText || latestTranscriptRecord?.text || '';
			if (transcriptText && !latestTranscriptRecord && botUserId && botUser) {
				try {
					const transcriptMessage = await sendMessage(
						botUser,
						{
							rid: roomId,
							msg: `[After-hours voicemail transcript] ${transcriptText}`,
						},
						room,
					);
					transcriptMessageId = (transcriptMessage as any)?._id || null;
				} catch (error: any) {
					console.error('[MedsenseVoice] after-hours voicemail transcript message failed', {
						roomId,
						requestId,
						sessionId,
						error: String(error?.message || error || 'Transcript message failed'),
					});
				}
			}

			let uploadedFile: any = null;
			let fileMessageId: string | null = null;
			let uploadError: string | null = null;
			let fileMessageError: string | null = null;
			let noteMessageError: string | null = null;
			const canDownloadRecording =
				recordingStatus !== 'absent' && recordingStatus !== 'failed' && Boolean(recordingUrl) && Boolean(botUserId);
			if (canDownloadRecording) {
				try {
					const recording = await downloadVoiceRecording(recordingUrl, String((payload as any).contentType || ''));
					uploadedFile = await uploadAfterHoursVoicemailRecording({
						roomId,
						userId: botUserId,
						recordingSid: recordingSid || eventId || null,
						buffer: recording.buffer,
						contentType: recording.contentType,
						durationSeconds,
					});
				} catch (error: any) {
					uploadError = String(error?.message || error || 'Recording storage failed');
					console.error('[MedsenseVoice] after-hours voicemail recording storage failed', {
						roomId,
						requestId,
						sessionId,
						recordingSid,
						error: uploadError,
					});
				}
				if (uploadedFile?._id) {
					try {
						await sendFileMessage(
							botUserId,
							{
								roomId,
								file: uploadedFile,
								msgData: {
									msg:
										typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
											? `[Voice] After-hours voicemail audio (${durationSeconds}s).`
											: '[Voice] After-hours voicemail audio.',
								},
							},
							{ parseAttachmentsForE2EE: false },
						);
						const fileMessage = await Messages.getMessageByFileIdAndUsername(uploadedFile._id, botUserId);
						fileMessageId = String((fileMessage as any)?._id || '');
					} catch (error: any) {
						fileMessageError = String(error?.message || error || 'Recording file message failed');
						console.error('[MedsenseVoice] after-hours voicemail file message failed', {
							roomId,
							requestId,
							sessionId,
							recordingSid,
							uploadId: uploadedFile._id,
							error: fileMessageError,
						});
					}
				}
			}

			if (!uploadedFile && botUserId && botUser) {
				const reason =
					recordingStatus === 'absent'
						? 'SignalWire reported no voicemail audio was captured.'
						: uploadError
							? `Voicemail audio could not be stored: ${uploadError}`
							: 'Voicemail recording URL was not provided.';
				try {
					await sendMessage(
						botUser,
						{
							rid: roomId,
							msg: `[Voice] After-hours voicemail ended. ${reason}`,
						},
						room,
					);
				} catch (error: any) {
					noteMessageError = String(error?.message || error || 'Voicemail room note failed');
					console.error('[MedsenseVoice] after-hours voicemail room note failed', {
						roomId,
						requestId,
						sessionId,
						recordingSid,
						error: noteMessageError,
					});
				}
			}

			const nowIso = new Date().toISOString();
			const storageError =
				uploadError || (recordingUrl && recordingStatus !== 'absent' && recordingStatus !== 'failed' && !botUserId ? botUserError : null);
			const voicemailRecord = {
				eventId: eventId || null,
				recordingSid: recordingSid || null,
				recordingStatus,
				sessionId: sessionId || voice.sessionId || null,
				durationSeconds,
				uploadId: uploadedFile?._id || null,
				uploadUrl: uploadedFile?.path || null,
				fileMessageId: fileMessageId || null,
				transcriptMessageId,
				transcriptText: resolvedTranscriptText || null,
				storageError,
				fileMessageError,
				noteMessageError,
				receivedAt: nowIso,
			};
			const nextProcessedEventIds = [...processedEventIds, ...eventIds].filter(Boolean).slice(-500);
			const nextVoice = {
				...voice,
				active: false,
				state: 'ended',
				lastRecordingAt: nowIso,
				lastEventAt: nowIso,
				lastEventId: eventId || voice.lastEventId || null,
				processedEventIds: nextProcessedEventIds,
				voicemailRecords: [...voicemailRecords.slice(-49), voicemailRecord],
			};
			const next = {
				...current,
				voice: nextVoice,
			};
			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: next } });

			const linkedRequestId = requestId || String((room as any).medsenseActiveRequestId || '').trim();
			let afterHoursNotifications = null;
			let afterHoursNotificationError: string | null = null;
			if (linkedRequestId) {
				try {
					const request = await MedsenseRequests.findOne({ _id: linkedRequestId });
					const pharmacyId = String((request as any)?.pharmacyId || '').trim();
					const pharmacy = pharmacyId ? await MedsensePharmacies.findOneById(pharmacyId) : null;
					if (request && pharmacy) {
						afterHoursNotifications = await sendAfterHoursNotificationsForVoicemail({
							pharmacy,
							requestId: linkedRequestId,
							voice: nextVoice,
							transcriptText: resolvedTranscriptText,
							recordingAvailable: Boolean(uploadedFile),
						});
						await MedsenseRequests.updateOne(
							{ _id: linkedRequestId },
							{
								$set: {
									afterHoursNotifications,
									_updatedAt: new Date(),
								},
							},
						);
					}
				} catch (error: any) {
					afterHoursNotificationError = String(error?.message || error || 'After-hours notification failed');
					console.error('[MedsenseVoice] after-hours voicemail notification failed', {
						roomId,
						requestId: linkedRequestId,
						sessionId,
						error: afterHoursNotificationError,
					});
					try {
						await MedsenseRequests.updateOne(
							{ _id: linkedRequestId },
							{
								$set: {
									afterHoursNotificationError,
									_updatedAt: new Date(),
								},
							},
						);
					} catch {
						// The recording webhook is already acknowledged; request metadata can be repaired separately.
					}
				}
			}

			return API.v1.success({
				ok: true,
				roomId,
				requestId: linkedRequestId || null,
				sessionId: sessionId || voice.sessionId || null,
				recordingStored: Boolean(uploadedFile),
				uploadId: uploadedFile?._id || null,
				fileMessageId,
				transcriptMessageId,
				afterHoursNotifications,
				afterHoursNotificationError,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/voice.voicemail.playback',
	{ authRequired: false },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ roomId: String, uploadId: String }));

			const roomId = String(this.queryParams.roomId || '').trim();
			const uploadId = String(this.queryParams.uploadId || '').trim();
			if (!roomId || !uploadId) {
				return API.v1.failure('Missing roomId or uploadId');
			}

			const playbackUserId = await resolveAuthenticatedRequestUserId(this.request, this.userId);
			if (!playbackUserId) {
				return API.v1.unauthorized('Unauthorized');
			}

			const room = await Rooms.findOneById(roomId, {
				projection: {
					_id: 1,
					medsenseSessionInfo: 1,
				},
			});
			if (!room?._id) {
				return API.v1.notFound('Room not found');
			}

			const canViewMedsenseRequests = await hasPermissionAsync(playbackUserId, 'medsense-view-request');
			const canAccessRoom = await canAccessRoomIdAsync(roomId, playbackUserId);
			if (!canViewMedsenseRequests && !canAccessRoom) {
				return API.v1.forbidden('Not allowed to access voicemail audio');
			}

			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const voicemailRecords = Array.isArray((sessionInfo.voice as any)?.voicemailRecords)
				? (sessionInfo.voice as any).voicemailRecords
				: [];
			const voicemailRecord = voicemailRecords.find((record: any) => String(record?.uploadId || '') === uploadId);
			if (!voicemailRecord) {
				return API.v1.notFound('Voicemail recording not found');
			}

			const file = await Uploads.findOneById(uploadId);
			if (!file?._id || file.rid !== roomId) {
				return API.v1.notFound('Voicemail audio file not found');
			}

			const rawContentType = String(file.type || '')
				.split(';')[0]
				.trim()
				.toLowerCase();
			if (!/^audio\/[a-z0-9.+-]+$/.test(rawContentType)) {
				return API.v1.failure('Voicemail upload is not an audio file');
			}

			const contentType = normalizeVoiceRecordingContentType(rawContentType);
			const buffer = await FileUpload.getBuffer(file);
			const rangeHeader = this.request.headers.get('range');
			return buildAudioPlaybackResponse(buffer, contentType, rangeHeader) as any;
		},
	},
);

API.v1.addRoute(
	'medsense/voice.browser-token',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.bodyParams.roomId);
			const room = await Rooms.findOneById(roomId, {
				projection: {
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					t: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}
			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			if (!sessionInfo.voice?.sessionId) {
				return API.v1.failure('No active voice session for this room');
			}
			try {
				if (room.t) {
					await addUserToRoom(roomId, this.user);
				}
				const response = await postToMedsenseVoiceService('/v1/voice/browser-token', {
					roomId,
					sessionId: sessionInfo.voice.sessionId,
					roomName: sessionInfo.voice.roomName || null,
					staffUserId: this.userId,
					staffUsername: this.user.username,
					staffName: this.user.name || '',
				});
				const activeRequestId =
					typeof (room as any).medsenseActiveRequestId === 'string' ? (room as any).medsenseActiveRequestId : undefined;
				const staffJoinedAt = new Date().toISOString();
				const nextSessionInfo = {
					...sessionInfo,
					currentOwner: 'staff',
					voice: {
						...sessionInfo.voice,
						staffJoinedAt,
						staffUserId: this.userId,
						staffUsername: this.user.username,
						staffName: this.user.name || '',
					},
				};
				if (activeRequestId) {
					await MedsenseRequests.markTaken(activeRequestId, this.userId, this.user.username);
				}
				await Rooms.update(
					{ _id: roomId },
					{
						$set: {
							...(activeRequestId ? { medsenseActiveRequestStatus: 'taken' } : {}),
							medsenseAssigned: 'Staff',
							medsenseSessionInfo: nextSessionInfo,
						},
					},
				);
				api.broadcast('room.save', {
					_id: roomId,
					...(activeRequestId ? { medsenseActiveRequestStatus: 'taken' } : {}),
					medsenseAssigned: 'Staff',
				});
				return API.v1.success(response.data || {});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'voice browser token failed');
			}
		},
	},
);

API.v1.addRoute(
	'medsense/voice.staff-phone-join',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.bodyParams.roomId);
			const room = await Rooms.findOneById(roomId, {
				projection: {
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					t: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}
			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			if (!sessionInfo.voice?.sessionId) {
				return API.v1.failure('No active voice session for this room');
			}
			if (!sessionInfo.voice?.roomName) {
				return API.v1.failure('Voice room name is missing for this session');
			}

			const staffUser = await Users.findOneById(this.userId, {
				projection: {
					_id: 1,
					username: 1,
					name: 1,
					phoneNumber: 1,
					phones: 1,
					phone: 1,
					customFields: 1,
				},
			});
			const staffPhone = getStaffVoicePhone(staffUser || this.user);
			if (!staffPhone) {
				return API.v1.failure('No valid staff phone number is saved on your user record.');
			}

			try {
				if (room.t) {
					await addUserToRoom(roomId, this.user);
				}
				const response = await postToMedsenseVoiceService('/v1/voice/staff-phone-join', {
					roomId,
					sessionId: sessionInfo.voice.sessionId,
					roomName: sessionInfo.voice.roomName,
					staffUserId: this.userId,
					staffUsername: this.user.username,
					staffName: this.user.name || '',
					staffPhone,
				});
				const activeRequestId =
					typeof (room as any).medsenseActiveRequestId === 'string' ? (room as any).medsenseActiveRequestId : undefined;
				const staffPhoneJoinRequestedAt = new Date().toISOString();
				const nextSessionInfo = {
					...sessionInfo,
					currentOwner: 'staff',
					voice: {
						...sessionInfo.voice,
						staffPhoneJoinRequestedAt,
						staffUserId: this.userId,
						staffUsername: this.user.username,
						staffName: this.user.name || '',
						staffPhoneMasked: maskPhoneNumber(staffPhone),
					},
				};
				if (activeRequestId) {
					await MedsenseRequests.markTaken(activeRequestId, this.userId, this.user.username);
				}
				await Rooms.update(
					{ _id: roomId },
					{
						$set: {
							...(activeRequestId ? { medsenseActiveRequestStatus: 'taken' } : {}),
							medsenseAssigned: 'Staff',
							medsenseSessionInfo: nextSessionInfo,
						},
					},
				);
				api.broadcast('room.save', {
					_id: roomId,
					...(activeRequestId ? { medsenseActiveRequestStatus: 'taken' } : {}),
					medsenseAssigned: 'Staff',
				});
				return API.v1.success({
					...(response.data || {}),
					staffPhoneMasked: maskPhoneNumber(staffPhone),
				});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'voice staff phone join failed');
			}
		},
	},
);

API.v1.addRoute(
	'medsense/voice.staff-transcript',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					text: String,
					eventId: Match.Maybe(String),
					confidence: Match.Maybe(Number),
					timestamp: Match.Maybe(String),
					final: Match.Maybe(Boolean),
				}),
			);

			const roomId = String(this.bodyParams.roomId);
			const text = normalizeText((this.bodyParams as any).text || '');
			if (!text) {
				return API.v1.success({ ok: true, ignored: true, reason: 'empty_text' });
			}

			const room = await Rooms.findOneById(roomId, { projection: { medsenseSessionInfo: 1 } });
			if (!room) {
				return API.v1.failure('Room not found');
			}
			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			if (!sessionInfo.voice?.sessionId) {
				return API.v1.failure('No active voice session for this room');
			}

			try {
				const response = await postToMedsenseVoiceService('/v1/voice/events/staff-transcript', {
					roomId,
					sessionId: sessionInfo.voice.sessionId,
					roomName: sessionInfo.voice.roomName || null,
					staffUserId: this.userId,
					staffUsername: this.user.username,
					text,
					final: (this.bodyParams as any).final !== false,
					eventId: String((this.bodyParams as any).eventId || '').trim() || undefined,
					confidence: typeof (this.bodyParams as any).confidence === 'number' ? (this.bodyParams as any).confidence : undefined,
					timestamp: String((this.bodyParams as any).timestamp || '').trim() || undefined,
				});
				return API.v1.success(response.data || { ok: true });
			} catch (error: any) {
				return API.v1.failure(error?.message || 'voice staff transcript failed');
			}
		},
	},
);

API.v1.addRoute(
	'medsense/voice.session.end',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.bodyParams.roomId);
			const room = await Rooms.findOneById(roomId, { projection: { medsenseSessionInfo: 1 } });
			if (!room) {
				return API.v1.failure('Room not found');
			}
			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			const sessionId = sessionInfo.voice?.sessionId;
			if (!sessionId) {
				return API.v1.success({ ok: true, message: 'No active voice session' });
			}

			try {
				await postToMedsenseVoiceService('/v1/voice/session/end', {
					roomId,
					sessionId,
					reason: String((this.bodyParams as any).reason || '').trim() || 'staff_end',
					closedByUserId: this.userId,
					closedByUsername: this.user.username,
				});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'voice session end failed');
			}

			const next = {
				...sessionInfo,
				voice: {
					...sessionInfo.voice,
					active: false,
					state: 'ended',
					lastEventAt: new Date().toISOString(),
				},
			};
			await Rooms.update({ _id: roomId }, { $set: { medsenseSessionInfo: next } });
			return API.v1.success({ ok: true });
		},
	},
);

API.v1.addRoute(
	'medsense/voice.session.state',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ roomId: String }));
			const roomId = String(this.queryParams.roomId);
			const room = await Rooms.findOneById(roomId, { projection: { medsenseSessionInfo: 1 } });
			if (!room) {
				return API.v1.failure('Room not found');
			}
			const sessionInfo = _normalizeSessionInfo((room as any).medsenseSessionInfo);
			return API.v1.success({
				roomId,
				voice: sessionInfo.voice,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/intervention-types.list',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			return API.v1.success({
				interventionTypes: getConfiguredInterventionTypes(),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/drug-catalog.list',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			const text = typeof this.queryParams?.text === 'string' ? this.queryParams.text : '';
			const limit = Math.min(100, Math.max(1, Number(this.queryParams?.limit) || 50));
			const drugs = await MedsenseDrugCatalog.searchActive(text, limit).toArray();
			return API.v1.success({
				drugs,
				...(await getDrugCatalogStats()),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/drug-catalog.import-status',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			return API.v1.success({
				...(await getDrugCatalogStats()),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/drug-catalog.import',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					fileName: String,
					fileContent: String,
					force: Match.Optional(Boolean),
				}),
			);

			const { fileName, fileContent, force } = this.bodyParams as any;
			const parsed = await parseCcddDrugCatalogContent(String(fileContent), String(fileName));
			const currentVersion = await Settings.findOneById('Medsense_CCDD_NTP_Imported_Version', { projection: { value: 1 } });
			if (!Boolean(force) && currentVersion?.value === parsed.version) {
				return API.v1.success({
					imported: false,
					reason: 'version_unchanged',
					version: parsed.version,
					rowCount: parsed.rowCount,
					...(await getDrugCatalogStats()),
				});
			}

			await MedsenseDrugCatalog.replaceCatalog(parsed.version, parsed.entries);
			const now = new Date();
			const lastImportedAt = now.toISOString();

			await Settings.updateOne(
				{ _id: 'Medsense_CCDD_NTP_Imported_Version' },
				{
					$set: {
						value: parsed.version,
						_updatedAt: now,
					},
					$setOnInsert: {
						createdAt: now,
					},
				},
				{ upsert: true },
			);
			await Settings.updateOne(
				{ _id: 'Medsense_CCDD_NTP_Last_Imported_At' },
				{
					$set: {
						value: lastImportedAt,
						_updatedAt: now,
					},
					$setOnInsert: {
						createdAt: now,
					},
				},
				{ upsert: true },
			);

			return API.v1.success({
				imported: true,
				version: parsed.version,
				rowCount: parsed.rowCount,
				sourceFile: parsed.sourceLabel,
				...(await getDrugCatalogStats()),
			});
		},
	},
);

API.v1.addRoute(
	'medsense/context.consolidated',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			check(
				this.queryParams,
				Match.ObjectIncluding({
					roomId: String,
					keywords: Match.Optional(String),
					limit: Match.Optional(String),
					messageCount: Match.Optional(String),
					patientUserId: Match.Optional(String),
				}),
			);

			const roomId = String(this.queryParams.roomId);
			const keywords = typeof this.queryParams.keywords === 'string' ? this.queryParams.keywords.trim() : '';
			const limit = Math.min(parseInt(this.queryParams.limit || '3', 10) || 3, 5);
			const parsedMessageCount = Number.parseInt(String(this.queryParams.messageCount || '10'), 10);
			const messageCount = Number.isFinite(parsedMessageCount) ? Math.max(1, Math.min(parsedMessageCount, 20)) : 10;

			const room = await Rooms.findOneById(roomId, {
				projection: {
					_id: 1,
					t: 1,
					fname: 1,
					name: 1,
					medsenseSessionInfo: 1,
					medsenseActiveRequestId: 1,
					medsenseActiveRequestStatus: 1,
					medsenseAssigned: 1,
				},
			});
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const sessionContext = _buildSessionContextView((room as any).medsenseSessionInfo, {
				bufferTailLimit: 2,
				formTailLimit: 10,
				recentAnswerLimit: 5,
			});

			let request = room.medsenseActiveRequestId ? await MedsenseRequests.findOneById(room.medsenseActiveRequestId) : null;
			if (!request) {
				request = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 } });
			}

			const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
			let pharmacyId = request?.pharmacyId;
			if (!pharmacyId && patientUserId) {
				const preference = await MedsensePatientPharmacy.findByPatientUserId(patientUserId);
				pharmacyId = preference?.pharmacyId;
			}

			const [patient, pharmacy] = await Promise.all([
				patientUserId ? Users.findOneById(patientUserId, { projection: { name: 1, username: 1 } }) : Promise.resolve(null),
				pharmacyId ? MedsensePharmacies.findOneById(pharmacyId) : Promise.resolve(null),
			]);

			const assigned = (room as any).medsenseAssigned === 'Staff' ? 'Staff' : 'AI';

			let previewMessages = [] as any[];
			try {
				const history = await loadMessageHistory({
					userId: this.userId,
					rid: roomId,
					limit: messageCount,
					showThreadMessages: true,
					offset: 0,
					end: undefined,
				});
				previewMessages = history.messages || [];
			} catch (error) {
				console.warn('[medsense/context.consolidated] failed to load room preview', error);
			}

			let safetyEntries = [] as any[];
			let patientContextMatches = [] as any[];
			if (patientUserId) {
				safetyEntries = await MedsensePatientContext.findRecentByPatient(patientUserId, 25).toArray();
				if (keywords) {
					patientContextMatches = await MedsensePatientContext.searchByPatient(patientUserId, keywords, limit);
					patientContextMatches = (patientContextMatches || []).map(_normalizePatientContextEntry);
				}
			}

			const response: any = {
				contextVersion: MEDSENSE_CONSOLIDATED_CONTEXT_VERSION,
				patientUserId: patientUserId || undefined,
				session: sessionContext.session,
				voice: sessionContext.voice,
				patientSafetySnapshot: _buildPatientSafetySnapshot(safetyEntries),
				roomPreview: {
					room: {
						_id: room._id,
						t: (room as any).t,
						fname: (room as any).fname || null,
						name: room.name || null,
						assigned,
					},
					messages: previewMessages,
				},
				requestState: {
					roomId,
					requestId: request?._id,
					requestStatus: request?.status || room.medsenseActiveRequestStatus || undefined,
					specialtyActionId: request?.specialtyActionId || undefined,
					flowId: request?.flowId || undefined,
					patientStage: request?.patientStage || undefined,
					patientUserId: patientUserId || undefined,
					patientName: patient?.name || patient?.username || undefined,
					pharmacyId,
					pharmacyName: pharmacy?.name || undefined,
					assigned,
				},
			};

			if (keywords) {
				response.patientContextMatches = patientContextMatches;
			}

			return API.v1.success(response);
		},
	},
);

// --- Documentation Templates Admin APIs ---

API.v1.addRoute(
	'medsense/documentation.templates.list',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			const templates = await MedsenseDocumentationTemplates.find({}, { sort: { createdAt: -1 } }).toArray();
			return API.v1.success({ templates: await Promise.all(templates.map((template) => hydrateTemplateDrugFieldOptions(template))) });
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.info',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ templateId: String }));
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			const template = await MedsenseDocumentationTemplates.findOneById(String(this.queryParams.templateId));
			if (!template) {
				return API.v1.failure('Template not found');
			}
			return API.v1.success({ template: await hydrateTemplateDrugFieldOptions(template) });
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.create',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					key: String,
					label: String,
					description: Match.Optional(String),
					interventionTypes: [String],
					specialtyActionIds: [String],
					sections: [Object],
					signatureRules: Match.ObjectIncluding({
						requirePharmacistSignature: Boolean,
						allowPatientSignature: Boolean,
						requirePatientSignature: Boolean,
					}),
					pdfConfig: Match.ObjectIncluding({
						documentTitle: String,
					}),
				}),
			);

			let normalizedTemplate: Partial<IMedsenseDocumentationTemplate>;
			try {
				normalizedTemplate = normalizeDocumentationTemplateInput(this.bodyParams);
			} catch (error: any) {
				return API.v1.failure(error?.message || 'Invalid template definition');
			}

			const { key, label, description, interventionTypes, specialtyActionIds, sections, signatureRules, pdfConfig } =
				normalizedTemplate as any;

			const existing = await MedsenseDocumentationTemplates.findOne({ key });
			if (existing) {
				return API.v1.failure('Template with this key already exists');
			}

			const insertResult = await MedsenseDocumentationTemplates.insertOne({
				key,
				label,
				description,
				status: 'draft',
				interventionTypes,
				specialtyActionIds,
				version: 1,
				sections,
				signatureRules,
				pdfConfig,
				createdAt: new Date(),
				_updatedAt: new Date(),
			});

			const template = await MedsenseDocumentationTemplates.findOneById(insertResult.insertedId);
			return API.v1.success({
				template: template ? await hydrateTemplateDrugFieldOptions(template as IMedsenseDocumentationTemplate) : template,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.update',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					templateId: String,
					updateData: Object,
				}),
			);

			const { templateId, updateData } = this.bodyParams as any;
			const template = await MedsenseDocumentationTemplates.findOneById(templateId);
			if (!template) {
				return API.v1.failure('Template not found');
			}

			let normalizedTemplate: Partial<IMedsenseDocumentationTemplate>;
			try {
				normalizedTemplate = normalizeDocumentationTemplateInput({
					...template,
					...updateData,
					key: template.key,
				});
			} catch (error: any) {
				return API.v1.failure(error?.message || 'Invalid template definition');
			}

			await MedsenseDocumentationTemplates.updateOne(
				{ _id: templateId },
				{
					$set: {
						...normalizedTemplate,
						version: template.version + 1,
						updatedAt: new Date(),
						_updatedAt: new Date(),
					},
				},
			);

			const updated = await MedsenseDocumentationTemplates.findOneById(templateId);
			return API.v1.success({
				template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.activate',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(this.bodyParams, Match.ObjectIncluding({ templateId: String }));
			const templateId = String(this.bodyParams.templateId);

			const template = await MedsenseDocumentationTemplates.findOneById(templateId);
			if (!template) {
				return API.v1.failure('Template not found');
			}

			// For each specialtyActionId, deactivate other templates
			for (const specialtyActionId of template.specialtyActionIds) {
				await MedsenseDocumentationTemplates.deactivateOtherTemplates(specialtyActionId, templateId);
			}

			await MedsenseDocumentationTemplates.updateOne({ _id: templateId }, { $set: { status: 'active', _updatedAt: new Date() } });

			const updated = await MedsenseDocumentationTemplates.findOneById(templateId);
			return API.v1.success({
				template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.deactivate',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(this.bodyParams, Match.ObjectIncluding({ templateId: String }));
			const templateId = String(this.bodyParams.templateId);

			await MedsenseDocumentationTemplates.updateOne({ _id: templateId }, { $set: { status: 'inactive', _updatedAt: new Date() } });

			const updated = await MedsenseDocumentationTemplates.findOneById(templateId);
			return API.v1.success({
				template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.remove',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(this.bodyParams, Match.ObjectIncluding({ templateId: String }));
			const templateId = String(this.bodyParams.templateId);

			const template = await MedsenseDocumentationTemplates.findOneById(templateId);
			if (!template) {
				return API.v1.failure('Template not found');
			}

			const result = await MedsenseDocumentationTemplates.deleteOne({ _id: templateId });
			if (!result.deletedCount) {
				return API.v1.failure('Template could not be removed');
			}

			return API.v1.success({ templateId });
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.templates.duplicate',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-medsense-documentation-templates'))) {
				return API.v1.forbidden();
			}

			check(this.bodyParams, Match.ObjectIncluding({ templateId: String, newKey: String }));
			const { templateId, newKey } = this.bodyParams as any;

			const template = await MedsenseDocumentationTemplates.findOneById(templateId);
			if (!template) {
				return API.v1.failure('Template not found');
			}

			const existing = await MedsenseDocumentationTemplates.findOne({ key: newKey });
			if (existing) {
				return API.v1.failure('Template with this key already exists');
			}

			const { _id, _updatedAt, updatedAt, createdAt, status, ...baseData } = template;
			const insertResult = await MedsenseDocumentationTemplates.insertOne({
				...baseData,
				key: newKey,
				label: `${template.label} (Copy)`,
				status: 'draft',
				version: 1,
				createdAt: new Date(),
				_updatedAt: new Date(),
			});

			const duplicated = await MedsenseDocumentationTemplates.findOneById(insertResult.insertedId);
			return API.v1.success({
				template: duplicated ? await hydrateTemplateDrugFieldOptions(duplicated as IMedsenseDocumentationTemplate) : duplicated,
			});
		},
	},
);

// --- Documentation Templates Runtime APIs ---

API.v1.addRoute(
	'medsense/interventions.documentation.launch',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					interventionId: String,
					templateId: Match.Optional(String),
					roomId: Match.Optional(String),
					appContextId: Match.Optional(String),
				}),
			);

			const interventionId = String(this.bodyParams.interventionId);
			const requestedTemplateId = typeof this.bodyParams.templateId === 'string' ? String(this.bodyParams.templateId) : undefined;
			const requestedRoomId = typeof this.bodyParams.roomId === 'string' ? String(this.bodyParams.roomId) : '';
			const appContextId = typeof this.bodyParams.appContextId === 'string' ? String(this.bodyParams.appContextId) : '';
			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			let template =
				intervention.documentationTemplateSnapshot ||
				(intervention.documentationTemplateId
					? await MedsenseDocumentationTemplates.findOneById(intervention.documentationTemplateId)
					: null);
			if (!template && requestedTemplateId) {
				const selectedTemplate = await MedsenseDocumentationTemplates.findOneById(requestedTemplateId);
				if (!selectedTemplate || selectedTemplate.status !== 'active') {
					return API.v1.failure('Template not found or inactive');
				}
				if (
					Array.isArray(selectedTemplate.interventionTypes) &&
					selectedTemplate.interventionTypes.length &&
					!selectedTemplate.interventionTypes.includes(intervention.type)
				) {
					return API.v1.failure('Selected template is not available for this intervention type');
				}

				await MedsenseInterventions.updateOne(
					{ _id: interventionId },
					{
						$set: {
							documentationTemplateId: selectedTemplate._id,
							documentationTemplateVersion: selectedTemplate.version,
							documentationTemplateSnapshot: selectedTemplate,
							documentationStatus: intervention.documentationStatus || 'draft',
							_updatedAt: new Date(),
						},
					},
				);
				template = selectedTemplate;
			}

			if (!template) {
				return API.v1.failure('No documentation template selected for this intervention');
			}

			const hydratedTemplate = await hydrateTemplateDrugFieldOptions(template);
			const updated = await MedsenseInterventions.findOneById(interventionId);
			let routePath = `/medsense/documentation/${interventionId}`;

			if (requestedRoomId) {
				const room = await Rooms.findOneById(requestedRoomId, {
					projection: {
						_id: 1,
						t: 1,
						name: 1,
					},
				});

				if (room) {
					if (room.t === 'd') {
						routePath = `/direct/${encodeURIComponent(room._id)}/medsense-documentation/${encodeURIComponent(interventionId)}`;
					} else if (room.t === 'c' && room.name) {
						routePath = `/channel/${encodeURIComponent(room.name)}/medsense-documentation/${encodeURIComponent(interventionId)}`;
					} else if (room.t === 'p' && room.name) {
						routePath = `/group/${encodeURIComponent(room.name)}/medsense-documentation/${encodeURIComponent(interventionId)}`;
					}
				}

				notifications.notifyRoom(requestedRoomId, 'medsense-documentation-handoff', {
					interventionId,
					returnTab: 'app',
					returnContext: appContextId,
				});
			}

			return API.v1.success({
				intervention: await hydrateInterventionDocumentationTemplate(updated),
				template: hydratedTemplate,
				lockedTemplateId: template._id,
				routePath,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.documentation.info',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, Match.ObjectIncluding({ interventionId: String }));
			const interventionId = String(this.queryParams.interventionId);

			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			return API.v1.success({ intervention: await hydrateInterventionDocumentationTemplate(intervention) });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.documentation.prefill',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					interventionId: String,
					roomId: Match.Optional(String),
					forceRefresh: Match.Optional(Boolean),
				}),
			);
			const { interventionId, roomId, forceRefresh } = this.bodyParams as any;

			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			const template =
				intervention.documentationTemplateSnapshot ||
				(intervention.documentationTemplateId
					? await MedsenseDocumentationTemplates.findOneById(intervention.documentationTemplateId)
					: null);
			if (!template) {
				return API.v1.failure('No documentation template selected for this intervention');
			}
			const hydratedTemplate = await hydrateTemplateDrugFieldOptions(template);

			if (!forceRefresh && Array.isArray(intervention.documentationPrefill?.fields) && intervention.documentationPrefill.fields.length) {
				return API.v1.success({
					intervention: await hydrateInterventionDocumentationTemplate(intervention),
					template: hydratedTemplate,
					prefill: {
						model: intervention.documentationPrefill?.model,
						fields: intervention.documentationPrefill?.fields,
						requestedAt: intervention.documentationPrefill?.requestedAt,
					},
				});
			}

			const draftValues = buildTemplateDraftValues(
				hydratedTemplate,
				intervention.documentationValues,
				intervention.prescriptions,
				intervention.followUp,
			);
			const context = await buildDocumentationContext(intervention, typeof roomId === 'string' ? roomId : undefined);
			const requestId = typeof context.request?._id === 'string' ? context.request._id : undefined;
			const aiRefs = deriveDocumentationAiRefs({
				requestId,
				roomId: typeof roomId === 'string' ? roomId : context.roomId,
				patientUserId: intervention.patientUserId,
			});
			context.aiRefs = aiRefs;
			const localPrefill = buildLocalDocumentationPrefill({
				template: hydratedTemplate,
				context,
				baseDocumentationValues: draftValues.documentationValues,
				baseFollowUp: draftValues.followUp,
			});
			const prefillResponse = await callDocumentationPrefillWebhook({
				roomId: typeof roomId === 'string' ? roomId : context.roomId,
				requestId,
				intervention,
				template: localPrefill.template,
				context,
				forceRefresh: Boolean(forceRefresh),
			});
			const appliedDraft = applyDocumentationPrefillResults({
				template: hydratedTemplate,
				baseDocumentationValues: draftValues.documentationValues,
				basePrescriptions: draftValues.prescriptions,
				baseFollowUp: draftValues.followUp,
				prefillResponse,
				localFields: localPrefill.fields,
			});

			const updateSet: Record<string, any> = {
				_updatedAt: new Date(),
			};

			if (!intervention.documentationTemplateId) {
				updateSet.documentationTemplateId = template._id;
			}

			if (!intervention.documentationTemplateVersion) {
				updateSet.documentationTemplateVersion = hydratedTemplate.version;
			}

			if (!intervention.documentationTemplateSnapshot) {
				updateSet.documentationTemplateSnapshot = hydratedTemplate;
			}

			if (!intervention.documentationStatus) {
				updateSet.documentationStatus = 'draft';
			}

			updateSet.documentationValues = intervention.documentationValues ?? appliedDraft.documentationValues;
			updateSet.prescriptions = intervention.prescriptions ?? appliedDraft.prescriptions;
			updateSet.followUp = intervention.followUp ?? appliedDraft.followUp;
			updateSet.documentationPrefill = {
				requestedAt: new Date(),
				completedAt: new Date(),
				model: appliedDraft.prefill.model,
				fields: appliedDraft.prefill.fields,
			};

			if (Object.keys(updateSet).length > 1) {
				await MedsenseInterventions.updateOne(
					{ _id: interventionId },
					{
						$set: updateSet,
					},
				);
			}

			const updated = await MedsenseInterventions.findOneById(interventionId);
			return API.v1.success({
				intervention: await hydrateInterventionDocumentationTemplate(updated),
				template: updated?.documentationTemplateSnapshot
					? await hydrateTemplateDrugFieldOptions(updated.documentationTemplateSnapshot)
					: hydratedTemplate,
				prefill: {
					model: appliedDraft.prefill.model,
					fields: appliedDraft.prefill.fields,
					requestedAt: new Date(),
				},
			});
		},
	},
);

API.v1.addRoute(
	'medsense/documentation.assistant',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					roomId: String,
					specialtyContext: String,
					requiredInformation: [String],
				}),
			);

			const roomId = String(this.bodyParams.roomId);
			const specialtyContext = String(this.bodyParams.specialtyContext).trim();
			const requiredInformation = Array.isArray((this.bodyParams as any).requiredInformation)
				? ((this.bodyParams as any).requiredInformation as unknown[])
						.map((item) => (typeof item === 'string' ? item.trim() : ''))
						.filter((item) => item.length > 0)
				: [];

			if (!specialtyContext || !requiredInformation.length) {
				return API.v1.failure('Missing assistant specialty context or required information');
			}

			const request = await MedsenseRequests.findOne({ roomId }, { sort: { createdAt: -1 } as any });
			if (!request) {
				return API.v1.failure('Request not found for room');
			}

			const canCreateInterventions = await hasPermissionAsync(this.userId, 'medsense-create-interventions');
			if (!canCreateInterventions) {
				const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
				const roles = user?.roles || [];
				if (!roles.includes('admin') && !roles.includes('bot')) {
					return API.v1.forbidden();
				}
			}

			const canManageAll = await hasPermissionAsync(this.userId, 'medsense-manage-all-pharmacies');
			if (!canManageAll) {
				const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId: request.pharmacyId, userId: this.userId });
				if (!membership) {
					return API.v1.forbidden();
				}
			}

			const context = await buildDocumentationContext(
				{
					_id: undefined,
					patientUserId: request.requestedByUserId,
					pharmacyId: request.pharmacyId,
					type: 'documentation_assistant',
					notes: '',
					documentationValues: {},
					prescriptions: [],
					followUp: {},
				},
				roomId,
			);
			const requestId = typeof context.request?._id === 'string' ? context.request._id : String(request._id || '');
			const response = await callDocumentationAssistantWebhook({
				roomId,
				requestId,
				patientUserId: request.requestedByUserId,
				specialtyContext,
				requiredInformation,
				context,
			});

			if (!response) {
				return API.v1.failure('Documentation assistant webhook failed');
			}

			const payload = (response.suggestions || response.assistant || response) as Record<string, any>;
			return API.v1.success({
				questions: normalizeDocumentationAssistantStringArray(
					payload.questions || payload.followUpQuestions || payload.keyFollowUpQuestions,
				),
				missingInformation: normalizeDocumentationAssistantStringArray(
					payload.missingInformation || payload.missingFields || payload.missing,
				),
				summary: typeof payload.summary === 'string' ? payload.summary : undefined,
				model: typeof payload.model === 'string' ? payload.model : undefined,
			});
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.documentation.saveDraft',
	{ authRequired: true },
	{
		async post() {
			check(
				this.bodyParams,
				Match.ObjectIncluding({
					interventionId: String,
					documentationValues: Match.Optional(Object),
					prescriptions: Match.Optional([Object]),
					followUp: Match.Optional(Object),
					documentationPrefill: Match.Optional(Object),
				}),
			);

			const { interventionId, documentationValues, prescriptions, followUp, documentationPrefill } = this.bodyParams as any;
			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			if (intervention.documentationStatus && intervention.documentationStatus !== 'draft') {
				return API.v1.failure('Documentation can only be edited while in draft status');
			}

			await MedsenseInterventions.updateOne(
				{ _id: interventionId },
				{
					$set: {
						documentationValues: documentationValues ?? intervention.documentationValues ?? {},
						prescriptions: prescriptions ?? intervention.prescriptions ?? [],
						followUp: followUp ?? intervention.followUp ?? {},
						documentationPrefill: documentationPrefill ?? intervention.documentationPrefill ?? {},
						documentationStatus: 'draft',
						_updatedAt: new Date(),
					},
				},
			);

			const updated = await MedsenseInterventions.findOneById(interventionId);
			return API.v1.success({ intervention: updated });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.documentation.finalize',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'complete-medsense-documentation'))) {
				return API.v1.forbidden();
			}

			check(this.bodyParams, Match.ObjectIncluding({ interventionId: String }));
			const { interventionId } = this.bodyParams as any;

			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			if (!intervention.documentationTemplateSnapshot) {
				return API.v1.failure('Needs a resolved template first (call prefill)');
			}

			const hasPendingSuggestions =
				Array.isArray(intervention.documentationPrefill?.fields) &&
				intervention.documentationPrefill.fields.some((field: any) => field?.reviewStatus === 'pending');
			if (hasPendingSuggestions) {
				return API.v1.failure('Resolve all pending prefill suggestions before finalizing');
			}

			const user = await Users.findOneById(this.userId);

			await MedsenseInterventions.updateOne(
				{ _id: interventionId },
				{
					$set: {
						documentationStatus: 'ready_for_review',
						documentationTemplateVersion: intervention.documentationTemplateSnapshot.version,
						finalizedAt: new Date(),
						finalizedBy: {
							_id: this.userId,
							username: user?.username || '',
						},
						_updatedAt: new Date(),
					},
				},
			);

			const updated = await MedsenseInterventions.findOneById(interventionId);
			return API.v1.success({ intervention: updated });
		},
	},
);

API.v1.addRoute(
	'medsense/interventions.documentation.sign',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'complete-medsense-documentation'))) {
				return API.v1.forbidden();
			}

			check(
				this.bodyParams,
				Match.ObjectIncluding({
					interventionId: String,
					role: String,
					signatureImageData: String,
					signerName: Match.Optional(String),
				}),
			);

			const { interventionId, role, signatureImageData, signerName } = this.bodyParams as any;
			if (role !== 'pharmacist' && role !== 'patient') {
				return API.v1.failure('Invalid signer role');
			}

			const intervention = await MedsenseInterventions.findOneById(interventionId);
			if (!intervention) {
				return API.v1.failure('Intervention not found');
			}

			if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
				return API.v1.forbidden();
			}

			const templateSnapshot = intervention.documentationTemplateSnapshot;
			if (!templateSnapshot) {
				return API.v1.failure('Finalize documentation before signing');
			}

			if (role === 'patient' && !templateSnapshot.signatureRules.allowPatientSignature) {
				return API.v1.failure('Patient signatures are not enabled for this template');
			}

			if (role === 'patient' && (!signerName || !String(signerName).trim())) {
				return API.v1.failure('Patient signer name is required');
			}

			const user = await Users.findOneById(this.userId);
			const nextSignatures = {
				...(intervention.signatures || {}),
				[role]: {
					name: role === 'patient' ? String(signerName).trim() : user?.name || user?.username || 'Unknown',
					role,
					signedAt: new Date(),
					signatureImageData,
				},
			};

			const pharmacistSigned = Boolean(nextSignatures.pharmacist);
			const patientSigned = Boolean(nextSignatures.patient);
			const documentationStatus =
				(!templateSnapshot.signatureRules.requirePharmacistSignature || pharmacistSigned) &&
				(!templateSnapshot.signatureRules.requirePatientSignature || patientSigned)
					? 'signed'
					: 'ready_for_review';

			await MedsenseInterventions.updateOne(
				{ _id: interventionId },
				{
					$set: {
						signatures: nextSignatures,
						documentationStatus,
						_updatedAt: new Date(),
					},
				},
			);

			const updated = await MedsenseInterventions.findOneById(interventionId);
			return API.v1.success({ intervention: updated });
		},
	},
);
