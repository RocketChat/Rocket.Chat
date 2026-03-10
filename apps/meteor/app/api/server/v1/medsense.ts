import { api, OmnichannelIntegration } from "@rocket.chat/core-services";
import type { IMedsenseDocumentationTemplate } from '@rocket.chat/core-typings';
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
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
    Settings,
    Users,
    Rooms,
    Subscriptions,
    Roles
} from "@rocket.chat/models";
import { check, Match } from "meteor/check";
import { HTTP } from "meteor/http";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { Apps } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';

import { hasAtLeastOnePermissionAsync, hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { addUserToRoom } from '../../../lib/server/functions/addUserToRoom';
import { archiveRoom } from '../../../lib/server/functions/archiveRoom';
import { createMedsenseBotRoom as createMedsenseBotRoomForUsers } from '../../../lib/server/functions/createMedsenseBotRoom';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { ensureUserInRoom } from '../../../lib/server/functions/ensureUserInRoom';
import { checkEmailAvailability } from '../../../lib/server/functions/checkEmailAvailability';
import { checkUsernameAvailability } from '../../../lib/server/functions/checkUsernameAvailability';
import { removeUserFromRoom } from '../../../lib/server/functions/removeUserFromRoom';
import { sendMessage } from '../../../lib/server/functions/sendMessage';
import { setUsernameWithValidation } from '../../../lib/server/functions/setUsername';
import { validateNameChars } from '../../../lib/server/functions/validateNameChars';
import { settings } from '../../../settings/server';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { registerUser } from '../../../../server/methods/registerUser';
import { API } from '../api';
import notifications from '../../../notifications/server/lib/Notifications';

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

const DOCUMENTATION_FIELD_TYPES = new Set([
	'readonly',
	'text',
	'textarea',
	'date',
	'select',
	'multiselect',
	'radio',
	'checkbox',
	'boolean',
	'drug',
	'repeater',
]);

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

	const normalizedFields = Array.isArray(field?.fields)
		? field.fields.map((child: any, childIndex: number) => normalizeTemplateField(child, childIndex, `${path}.fields[${childIndex}]`))
		: undefined;
	const drugCatalogCodes = Array.isArray(field?.drugCatalogCodes)
		? field.drugCatalogCodes.map((code: any) => String(code).trim()).filter(Boolean)
		: undefined;

	if (type === 'repeater' && (!normalizedFields || !normalizedFields.length)) {
		throw new Meteor.Error('invalid-template-field', `Repeater fields require nested fields at ${path}`);
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
		fields: normalizedFields,
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
		fields: Array.isArray(section?.fields)
			? section.fields.map((field: any, fieldIndex: number) => normalizeTemplateField(field, fieldIndex, `sections[${index}].fields[${fieldIndex}]`))
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
	const codes = Array.from(
		new Set(
			sections.flatMap((section) =>
				(section.fields || []).flatMap((field: any) => (Array.isArray(field?.drugCatalogCodes) ? field.drugCatalogCodes : [])),
			),
		),
	);

	if (!codes.length) {
		return template;
	}

	const drugs = await MedsenseDrugCatalog.findActiveByCodes(codes).toArray();
	const displayByCode = new Map(drugs.map((drug) => [drug.code, drug.displayName]));

	return {
		...template,
		sections: sections.map((section) => ({
			...section,
			fields: (section.fields || []).map((field: any) => {
				if (field.type !== 'drug' || !Array.isArray(field.drugCatalogCodes)) {
					return field;
				}

				return {
					...field,
					options: field.drugCatalogCodes.map((code: string) => displayByCode.get(code)).filter(Boolean),
				};
			}),
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
		const normalized = values
			.map((item) => String(item).trim())
			.filter((item) => item.length > 0);
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

	const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
	return normalized || undefined;
};

const buildDocumentationContext = async (intervention: any, requestedRoomId?: string): Promise<Record<string, any>> => {
	const patient = await Users.findOneById(intervention.patientUserId, {
		projection: {
			name: 1,
			username: 1,
			emails: 1,
		},
	});

	let request = requestedRoomId
		? await MedsenseRequests.findOne({ roomId: requestedRoomId }, { sort: { createdAt: -1 } as any })
		: null;

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
	const sessionInfo = _normalizeSessionInfo((room as any)?.medsenseSessionInfo);
	const roomContextSummaries = Array.isArray(sessionInfo.roomContextSummaries) ? sessionInfo.roomContextSummaries : [];
	const roomContextSummary = roomContextSummaries.length ? roomContextSummaries[roomContextSummaries.length - 1] : null;

	return {
		roomId: resolvedRoomId,
		patient: {
			name: patient?.name,
			username: patient?.username,
			email: Array.isArray((patient as any)?.emails) ? (patient as any).emails[0]?.address : undefined,
		},
		request,
		roomContextSummary,
		roomFormSubmissions: Array.isArray((sessionInfo as any).roomFormSubmissions) ? (sessionInfo as any).roomFormSubmissions : [],
		intervention,
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
	const webhookUrl =
		settings.get<string>('Medsense_Documentation_Prefill_Webhook_Url') || process.env.MEDSENSE_DOCUMENTATION_PREFILL_WEBHOOK_URL;
	const webhookSecret =
		settings.get<string>('Medsense_Documentation_Prefill_Webhook_Secret') || process.env.MEDSENSE_DOCUMENTATION_PREFILL_WEBHOOK_SECRET;
	const timeoutMsRaw =
		settings.get<string>('Medsense_Documentation_Prefill_Timeout_MS') || process.env.MEDSENSE_DOCUMENTATION_PREFILL_TIMEOUT_MS || '15000';
	const timeoutMs = Number.parseInt(String(timeoutMsRaw), 10) || 15000;

	if (!webhookUrl || !webhookSecret) {
		return null;
	}

	const payload = {
		roomId: roomId || context.roomId,
		requestId,
		interventionId: intervention._id,
		specialtyActionId: intervention.specialtyActionId,
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
			roomContextSummary: context.roomContextSummary,
			roomFormSubmissions: context.roomFormSubmissions || [],
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
		const response = await HTTP.post(webhookUrl, {
			timeout: timeoutMs,
			headers: {
				'Content-Type': 'application/json',
				'X-Rocketchat-Secret': webhookSecret,
			},
			data: payload,
		});

		return response?.data && typeof response.data === 'object' ? response.data : null;
	} catch (error) {
		console.error('Documentation prefill webhook failed', error);
		return null;
	}
};

const applyDocumentationPrefillResults = ({
	template,
	baseDocumentationValues,
	basePrescriptions,
	baseFollowUp,
	prefillResponse,
}: {
	template: IMedsenseDocumentationTemplate;
	baseDocumentationValues: Record<string, any>;
	basePrescriptions: any[];
	baseFollowUp: Record<string, any>;
	prefillResponse: Record<string, any> | null;
}) => {
	const documentationValues = { ...(baseDocumentationValues || {}) };
	const prescriptions = Array.isArray(basePrescriptions) ? [...basePrescriptions] : [];
	const followUp = { ...(baseFollowUp || {}) };
	const metadataFields: Array<Record<string, any>> = [];

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

		const existingValue = section.type === 'follow_up' ? followUp[field.key] : section.type === 'prescriptions' ? prescriptions : documentationValues[field.key];
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

const buildRegistrationSMS = ({ linkUrl, code, patientName }: { linkUrl: string; code: string; patientName?: string }): string => {
    const greeting = patientName?.trim() ? `Hello ${patientName.trim()},` : 'Hello,';
    return `${greeting} use code ${code} to continue your MedSense registration: ${linkUrl} (expires in 15 minutes).`;
};

const findRegistrationByToken = async (token: string): Promise<IMedsensePatientRegistration | null> => {
    const tokenHash = hashRegistrationValue(token);
    return MedsensePatientRegistrations.findOneAsync({ tokenHash });
};

const getMedsenseOrchestratorBaseUrl = (): string | null => {
    const candidates = [
        process.env.MEDSENSE_ORCHESTRATOR_URL,
        process.env.ORCHESTRATOR_URL,
    ];
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
    const mapped = actions.find((action) => action.id.toLowerCase().endsWith(':' + normalized))
        || actions.find((action) => action.id.toLowerCase().endsWith(':uti_assessment') && normalized === 'uti');

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

const updateRoomRequestStatus = async (roomId: string, status: string, requestId?: string): Promise<void> => {
    await Rooms.update(
        { _id: roomId },
        {
            $set: {
                ...(requestId ? { medsenseActiveRequestId: requestId } : {}),
                medsenseActiveRequestStatus: status,
            },
        },
    );
    api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: status });
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
            },
        },
    );
    api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: null });
    await archiveRoom(roomId, { _id: closedByUserId, username: closedByUsername || 'system' });
};

// Pharmacies Management (Kept Intact)
API.v1.addRoute(
    "medsense/pharmacies.list",
    { authRequired: true },
    {
        async get() {
            const manageAll = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
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
    "medsense/pharmacies.info",
    { authRequired: true },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
            const { pharmacyId } = this.queryParams;

            const manageAll = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
            const manageOwn = await hasPermissionAsync(this.userId, "medsense-manage-individual-pharmacy");

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
                { projection: { _id: 1, name: 1 }, sort: { name: 1 } }
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
            if (!(await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies"))) {
                return API.v1.forbidden();
            }

            check(
                this.bodyParams,
                Match.ObjectIncluding({
                    name: String,
                    slug: String,
                    active: Boolean,
                }),
            );

            const { name, slug, active } = this.bodyParams;

            if (await MedsensePharmacies.findOneBySlug(slug)) {
                return API.v1.failure("Pharmacy with this slug already exists");
            }

            const pharmacyId = (
                await MedsensePharmacies.create({
                    name,
                    slug,
                    active,
                    createdBy: this.userId,
                })
            ).insertedId;

            // Add create as owner
            await MedsensePharmacyMemberships.insertOne({
                pharmacyId,
                userId: this.userId,
                roles: ["owner"],
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
    "medsense/pharmacies.update",
    { authRequired: true },
    {
        async post() {
            if (!(await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies"))) {
                return API.v1.forbidden();
            }

            check(
                this.bodyParams,
                Match.ObjectIncluding({
                    pharmacyId: String,
                    updateData: Match.ObjectIncluding({
                        name: Match.Maybe(String),
                        active: Match.Maybe(Boolean),
                    }),
                }),
            );

            const { pharmacyId, updateData } = this.bodyParams;

            const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
            if (!pharmacy) {
                return API.v1.failure("Pharmacy not found");
            }

            await MedsensePharmacies.updateOne(
                { _id: pharmacyId },
                {
                    $set: {
                        ...updateData,
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
    "medsense/pharmacies.list.managed",
    { authRequired: true },
    {
        async get() {
            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");

            if (isGlobalAdmin) {
                const pharmacies = await MedsensePharmacies.find({}, { sort: { name: 1 } }).toArray();

                // Fetch actual memberships for the current user
                const myMemberships = await MedsensePharmacyMemberships.find({ userId: this.userId }).toArray();
                const membershipMap = new Map(myMemberships.map(m => [m.pharmacyId, m.roles]));

                const enriched = pharmacies.map(p => ({
                    ...p,
                    myRoles: membershipMap.get(p._id) || ['admin'] // Show actual roles, or 'admin' if not a member
                }));
                return API.v1.success({ pharmacies: enriched });
            }

            // Find where user is owner or manager
            const memberships = await MedsensePharmacyMemberships.find({
                userId: this.userId,
                roles: { $in: ['owner', 'manager'] }
            }).toArray();

            if (memberships.length === 0) {
                return API.v1.success({ pharmacies: [] });
            }

            const pharmacyIds = memberships.map(m => m.pharmacyId);
            const pharmacies = await MedsensePharmacies.find({ _id: { $in: pharmacyIds } }, { sort: { name: 1 } }).toArray();

            const enriched = pharmacies.map(p => {
                const membership = memberships.find(m => m.pharmacyId === p._id);
                return { ...p, myRoles: membership?.roles || [] };
            });

            return API.v1.success({ pharmacies: enriched });
        },
    },
);

API.v1.addRoute(
    "medsense/pharmacies.members.list",
    { authRequired: true },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
            const { pharmacyId } = this.queryParams;

            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
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
    "medsense/patients.byPharmacy",
    { authRequired: true },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({
                pharmacyId: String,
                text: Match.Optional(String),
                offset: Match.Optional(String),
                count: Match.Optional(String),
            }));

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

            const patientUserIds = [...new Set(patientPharmacyMappings.map((mapping: any) => String(mapping.patientUserId || '')).filter(Boolean))];
            if (!patientUserIds.length) {
                return API.v1.success({ users: [], total: 0 });
            }

            const userQuery: any = { _id: { $in: patientUserIds } };
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
    "medsense/pharmacies.members.invite",
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

            const isAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
            if (!isAdmin) {
                const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
                if (!membership || !membership.roles.includes("manager")) {
                    return API.v1.forbidden();
                }
            }

            const user = await Users.findOneByUsername(username);
            if (!user) {
                return API.v1.failure("User not found");
            }

            const existing = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: user._id });
            if (existing) {
                return API.v1.failure("User already a member of this pharmacy");
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
    "medsense/pharmacies.members.remove",
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

            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
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
                return API.v1.failure("User is not a member");
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
                return API.v1.failure("Owners can only be removed by administrators.");
            }

            if (!isGlobalAdmin && !isOwner && isManager) {
                if (targetIsOwner || targetIsManager) {
                    return API.v1.failure("Managers cannot remove other managers or owners.");
                }
            }

            if (!isGlobalAdmin && isOwner) {
                // Owners can remove managers and staff, but not owners (already checked above)
                if (targetIsOwner) {
                    return API.v1.failure("Owners cannot remove other owners.");
                }
            }

            if (targetIsOwner) {
                // Check if last owner (only applies when admin is removing)
                const owners = await MedsensePharmacyMemberships.find({ pharmacyId, roles: 'owner' }).toArray();
                if (owners.length <= 1) {
                    return API.v1.failure("Cannot remove the last owner of the pharmacy.");
                }
            }

            await MedsensePharmacyMemberships.deleteOne({ pharmacyId, userId });
            return API.v1.success();
        },
    },
);

// Patient Preferences
API.v1.addRoute(
    "medsense/patient.pharmacy.resolve",
    { authRequired: true },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({ userId: String }));
            const { userId } = this.queryParams;

            if (!(await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies"))) {
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
    "medsense/patient.pharmacy.mine",
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
    "medsense/patient.pharmacy.set",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({ pharmacyId: String }));
            const { pharmacyId } = this.bodyParams;

            const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
            if (!pharmacy) {
                return API.v1.failure("Pharmacy not found");
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
    "medsense/request.create",
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
                contextSummary,
                botUserId,
                status,
                pendingPatientUsername,
                pendingPatientName,
            } = this.bodyParams;

            const isAdmin = await hasPermissionAsync(this.userId, "admin");
            if (!isAdmin) {
                const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
                if (!user?.roles.includes('bot')) {
                    return API.v1.forbidden();
                }
            }

            const requesterUser = await Users.findOneById(requestedByUserId, { projection: { username: 1, name: 1, roles: 1 } });
            if (!requesterUser?._id || !requesterUser.username) {
                return API.v1.failure("Requested-by user not found");
            }

            const patientUser = Array.isArray(requesterUser.roles) && requesterUser.roles.length === 1 && requesterUser.roles.includes('user')
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
                return API.v1.failure("Medsense bot user not found");
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
                return API.v1.failure("Failed to create request room");
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
                return API.v1.failure("Failed to create request room");
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
    "medsense/request.set",
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
                    contextSummary: Match.Maybe(String),
                    status: Match.Maybe(String),
                }),
            );
            const { roomId, pharmacyId, reason, requestedByUserId, requestedByUsername, contextSummary, status } = this.bodyParams;

            // Auth check: Admin or Bot (Orchestrator)
            const isAdmin = await hasPermissionAsync(this.userId, "admin");
            if (!isAdmin) {
                const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
                if (!user?.roles.includes('bot')) { // Simple bot check
                    return API.v1.forbidden();
                }
            }

            const activeRequest = await MedsenseRequests.findActiveByRoomId(roomId);
            if (activeRequest) {
                return API.v1.failure("Active request already exists for this room.");
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
                reason,
                status: requestStatus,
                patientStage: 'pre_assessment',
                contextSummary: contextSummary || '',
                answers: {},
                preAssessmentExpiresAt,
                createdAt: now,
            });

            // Lightweight pointer on Room
            await Rooms.update(
                { _id: roomId },
                {
                    $set: {
                        medsenseActiveRequestId: requestId,
                        medsenseActiveRequestStatus: requestStatus,
                    },
                }
            );

            api.broadcast('room.save', { _id: roomId, medsenseActiveRequestStatus: requestStatus });

            return API.v1.success({ requestId });
        },
    },
);

// Update Request Progress (Clinical Flow)
API.v1.addRoute(
    "medsense/request.update",
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
                }),
            );
            const { requestId, patientStage, contextSummary, answers, currentStepId, status } = this.bodyParams;

            // Auth check: Admin or Bot (likely Orchestrator/SmartForms) or Pharmacy Staff
            if (!(await hasPermissionAsync(this.userId, "medsense-take-request"))) {
                const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
                if (!user?.roles.includes('bot')) {
                    return API.v1.forbidden();
                }
            }

            const request = await MedsenseRequests.findOneById(requestId);
            if (!request) {
                return API.v1.failure("Request not found");
            }

            await MedsenseRequests.updateAssessmentProgress(requestId, {
                patientStage,
                contextSummary,
                answers,
                currentStepId,
                status,
            });

            if (status && request.roomId) {
                await Rooms.update(
                    { _id: request.roomId },
                    {
                        $set: {
                            medsenseActiveRequestStatus: status,
                        },
                    },
                );
                api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: status });
            }

            return API.v1.success();
        },
    },
);

// Get Request Info
API.v1.addRoute(
    "medsense/request.info",
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
                return API.v1.failure("Request not found");
            }
            return API.v1.success({ request });
        },
    },
);

// List Waiting Requests (Pending)
API.v1.addRoute(
    "medsense/request.list",
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
            const roomIds = requests.map(r => r.roomId);
            const rooms = await Rooms.find({ _id: { $in: roomIds } }, { projection: { fname: 1, name: 1, t: 1 } }).toArray();
            const roomMap = new Map(rooms.map(r => [r._id, r]));

            const enriched = requests.map(r => ({
                ...r,
                roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room'
            }));

            return API.v1.success({ requests: enriched });
        },
    },
);

// List Followed Requests (Taken by anyone in pharmacy, or generally taken)
API.v1.addRoute(
    "medsense/request.followed",
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
            const roomIds = requests.map(r => r.roomId);
            const rooms = await Rooms.find({ _id: { $in: roomIds } }, { projection: { fname: 1, name: 1 } }).toArray();
            const roomMap = new Map(rooms.map(r => [r._id, r]));

            const enriched = requests.map(r => ({
                ...r,
                roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room'
            }));

            return API.v1.success({ requests: enriched });
        },
    },
);

// Take Request
API.v1.addRoute(
    "medsense/request.take",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({ requestId: String }));
            const { requestId } = this.bodyParams;

            if (!(await hasPermissionAsync(this.userId, 'medsense-take-request'))) {
                return API.v1.forbidden();
            }

            const request = await MedsenseRequests.findOneById(requestId);
            if (!request || !['invite_sent', 'waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(request.status)) {
                return API.v1.failure("Request not found or not pending");
            }

            const room = await Rooms.findOneById(request.roomId);
            if (!room?.t) {
                return API.v1.failure("Room type missing for request room");
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
                    },
                }
            );

            // System Message
            await sendMessage(this.user, {
                rid: request.roomId,
                msg: `Request taken by @${this.user.username}`,
            }, room);

            api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: 'taken' });

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

            if (!isBot) {
                try {
                    await removeUserFromRoom(request.roomId, this.user);
                } catch (error: any) {
                    return API.v1.failure(`Failed to remove user from room: ${error?.message ?? error}`);
                }
            }

            await MedsenseRequests.markClosed(requestId, this.userId, this.user.username);

            await Rooms.update(
                { _id: request.roomId },
                {
                    $unset: {
                        medsenseActiveRequestId: 1,
                        medsenseActiveRequestStatus: 1,
                    },
                },
            );

            const closeMessageRecord = await sendMessage(
                this.user,
                {
                    rid: request.roomId,
                    msg: typeof message === 'string' && message.trim() ? message.trim() : `Request closed by @${this.user.username}`,
                },
                room,
            );

            api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null });
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
                ro: true,
                reactWhenReadOnly: false,
            });

            return API.v1.success();
        },
    },
);

// Decline Request (close with decline message)
API.v1.addRoute(
    "medsense/request.decline",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                requestId: String,
                message: Match.Maybe(String),
            }));
            const { requestId, message } = this.bodyParams;

            if (!(await hasPermissionAsync(this.userId, 'medsense-close-request'))) {
                return API.v1.forbidden();
            }

            const request = await MedsenseRequests.findOneById(requestId);
            if (!request || !['invite_sent', 'waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(request.status)) {
                return API.v1.failure("Request not found or not pending");
            }

            const room = await Rooms.findOneById(request.roomId);
            if (!room?.t) {
                return API.v1.failure("Room type missing for request room");
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
                    },
                }
            );

            // Post decline message (as bot if available)
            const declineText = message
                ? `Request declined by @${this.user.username}: ${message}`
                : `Request declined by @${this.user.username}`;
            const botUsername = settings.get<string>('Medsense_Bot_User') || 'bot';
            const botUser = botUsername
                ? await Users.findOneByUsername(botUsername, { projection: { username: 1 } })
                : null;
            const messageUser = botUser ?? this.user;
            const declineMessageRecord = await sendMessage(messageUser, {
                rid: request.roomId,
                msg: declineText,
            }, room);

            api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null });
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
                ro: true,
                reactWhenReadOnly: false,
            });

            return API.v1.success();
        },
    },
);

// Request History
API.v1.addRoute(
    "medsense/request.history",
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
            const roomIds = requests.map(r => r.roomId);
            const rooms = await Rooms.find({ _id: { $in: roomIds } }, { projection: { fname: 1, name: 1 } }).toArray();
            const roomMap = new Map(rooms.map(r => [r._id, r]));

            const enriched = requests.map(r => ({
                ...r,
                roomName: roomMap.get(r.roomId)?.fname || roomMap.get(r.roomId)?.name || 'Unknown Room'
            }));

            return API.v1.success({ requests: enriched });
        },
    },
);

// =========================================================================================
// NEW: Medsense Hub (Entrypoint) APIs
// =========================================================================================

API.v1.addRoute(
    "medsense/hub.actions",
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
    "medsense/registration.specialtyActions",
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
    "medsense/hub.execute",
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
    "medsense/invite.sms",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                roomId: String,
                phoneNumber: String,
                requestedBy: Match.Maybe(String),
                patientName: Match.Maybe(String),
            }));

            const { roomId, phoneNumber, patientName } = this.bodyParams;

            const isAdmin = await hasPermissionAsync(this.userId, "admin");
            let allowed = isAdmin;
            if (!allowed) {
                const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
                if (user?.roles.includes('bot')) allowed = true;
            }
            if (!allowed && await hasPermissionAsync(this.userId, "medsense-take-request")) {
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
        }
    }
);

// =========================================================================================
// Patient Registration with Verification Code
// =========================================================================================
API.v1.addRoute(
    "medsense/registration.start",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                phoneNumber: String,
                name: Match.Maybe(String),
                email: Match.Maybe(String),
                username: Match.Maybe(String),
                reason: Match.Maybe(String),
                pharmacyId: Match.Maybe(String),
                specialtyActionId: Match.Maybe(String),
                specialtyFlowId: Match.Maybe(String),
                specialtyRoomId: Match.Maybe(String),
            }));

            if (!(await hasPermissionAsync(this.userId, "medsense-view-request"))) {
                return API.v1.forbidden();
            }

            const normalizedPhone = normalizeRegistrationPhone(String(this.bodyParams.phoneNumber));
            if (!normalizedPhone) {
                return API.v1.failure("Invalid phone number format. Use +1234567890 or 1234567890");
            }

            const selectedPharmacyId = this.bodyParams.pharmacyId ? String(this.bodyParams.pharmacyId) : undefined;
            if (!selectedPharmacyId || selectedPharmacyId === "all") {
                return API.v1.failure("pharmacyId is required");
            }

            const pharmacy = await MedsensePharmacies.findOneById(selectedPharmacyId);
            if (!pharmacy) {
                return API.v1.failure("Pharmacy not found");
            }
            if (pharmacy.active === false) {
                return API.v1.failure("Pharmacy is inactive");
            }

            const canManageAll = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
            if (!canManageAll) {
                const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId: selectedPharmacyId, userId: this.userId });
                if (!membership) {
                    return API.v1.forbidden();
                }
            }

            const providedSpecialtyActionId = this.bodyParams.specialtyActionId
                ? String(this.bodyParams.specialtyActionId).trim()
                : undefined;
            const legacySpecialtyFlowId = this.bodyParams.specialtyFlowId
                ? String(this.bodyParams.specialtyFlowId).trim()
                : undefined;
            let resolvedSpecialtyActionId = providedSpecialtyActionId;

            if (!resolvedSpecialtyActionId && legacySpecialtyFlowId) {
                resolvedSpecialtyActionId = await resolveLegacySpecialtyFlowToActionId(legacySpecialtyFlowId) || undefined;
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
                status: "pending",
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
                await MedsensePatientRegistrations.updateAsync(
                    { _id: registrationId as string },
                    {
                        $set: {
                            specialtyStatus: 'invite_sent',
                            specialtyRequestId,
                            specialtyRoomId: specialtyRoomId || undefined,
                            _updatedAt: new Date(),
                        },
                    } as any,
                );
            }

            return API.v1.success({
                registrationId,
                linkUrl,
                smsStatus: "sent",
            });
        },
    },
);

API.v1.addRoute(
    "medsense/registration.verify",
    { authRequired: false },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                token: String,
                code: String,
            }));

            const token = String(this.bodyParams.token).trim();
            const code = String(this.bodyParams.code).trim();
            if (!token || !code) {
                return API.v1.failure("Invalid verification request");
            }

            const registration = await findRegistrationByToken(token);
            if (!registration) {
                return API.v1.failure("Registration link is invalid");
            }

            const now = new Date();
            if (registration.status === "completed") {
                return API.v1.failure("Registration is already completed");
            }

            if (registration.status === "expired") {
                return API.v1.failure("Verification code expired");
            }

            if (
                registration.status === "locked" &&
                registration._updatedAt &&
                (now.getTime() - new Date(registration._updatedAt).getTime()) < REGISTRATION_LOCK_TTL_MS
            ) {
                return API.v1.failure("Too many invalid attempts. Please wait and try again.");
            }

            if (new Date(registration.codeExpiresAt).getTime() <= now.getTime()) {
                await MedsensePatientRegistrations.updateAsync(
                    { _id: registration._id },
                    { $set: { status: "expired", _updatedAt: now } } as any,
                );
                return API.v1.failure("Verification code expired");
            }

            const codeHash = hashRegistrationValue(code);
            if (!safeHashEqual(registration.codeHash, codeHash)) {
                const nextAttempts = (registration.attemptCount || 0) + 1;
                const nextStatus: MedsenseRegistrationStatus = nextAttempts >= REGISTRATION_MAX_ATTEMPTS ? "locked" : "pending";
                await MedsensePatientRegistrations.updateAsync(
                    { _id: registration._id },
                    { $set: { attemptCount: nextAttempts, status: nextStatus, _updatedAt: now } } as any,
                );
                if (nextStatus === "locked") {
                    return API.v1.failure("Too many invalid attempts. Please wait and try again.");
                }
                return API.v1.failure("Invalid verification code");
            }

            const verificationSession = createRegistrationSessionToken();
            const verificationSessionHash = hashRegistrationValue(verificationSession);
            const verificationSessionExpiresAt = new Date(now.getTime() + REGISTRATION_SESSION_TTL_MS);

            await MedsensePatientRegistrations.updateAsync(
                { _id: registration._id },
                {
                    $set: {
                        status: "verified",
                        attemptCount: 0,
                        verificationSessionHash,
                        verificationSessionExpiresAt,
                        _updatedAt: now,
                    },
                } as any,
            );

            return API.v1.success({
                verificationSession,
                verificationSessionExpiresAt: verificationSessionExpiresAt.toISOString(),
            });
        },
    },
);

API.v1.addRoute(
    "medsense/registration.resend",
    { authRequired: false },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                token: String,
            }));

            const token = String(this.bodyParams.token).trim();
            const registration = await findRegistrationByToken(token);
            if (!registration) {
                return API.v1.failure("Registration link is invalid");
            }

            if (registration.status === "completed") {
                return API.v1.failure("Registration is already completed");
            }

            const now = new Date();
            if (registration.resendCount >= REGISTRATION_MAX_RESENDS) {
                await MedsensePatientRegistrations.updateAsync(
                    { _id: registration._id },
                    { $set: { status: "locked", _updatedAt: now } } as any,
                );
                return API.v1.failure("Resend limit reached");
            }

            const lastSentTime = new Date(registration.lastSentAt).getTime();
            if (now.getTime() - lastSentTime < REGISTRATION_RESEND_COOLDOWN_MS) {
                return API.v1.failure("Please wait before requesting a new code");
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

            await MedsensePatientRegistrations.updateAsync(
                { _id: registration._id },
                {
                    $set: {
                        codeHash,
                        codeExpiresAt,
                        lastSentAt: now,
                        attemptCount: 0,
                        status: "pending",
                        verificationSessionHash: undefined,
                        verificationSessionExpiresAt: undefined,
                        _updatedAt: now,
                    },
                    $inc: { resendCount: 1 },
                } as any,
            );

            return API.v1.success({
                smsStatus: "sent",
                resendCount: (registration.resendCount || 0) + 1,
            });
        },
    },
);

API.v1.addRoute(
    "medsense/registration.prefill",
    { authRequired: false },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({
                token: String,
                verificationSession: String,
            }));

            const token = String(this.queryParams.token).trim();
            const verificationSession = String(this.queryParams.verificationSession).trim();
            const registration = await findRegistrationByToken(token);
            if (!registration) {
                return API.v1.failure("Registration link is invalid");
            }

            if (!registration.verificationSessionHash || !registration.verificationSessionExpiresAt) {
                return API.v1.failure("Verification session is missing");
            }

            const verificationSessionHash = hashRegistrationValue(verificationSession);
            if (!safeHashEqual(registration.verificationSessionHash, verificationSessionHash)) {
                return API.v1.failure("Verification session is invalid");
            }

            if (new Date(registration.verificationSessionExpiresAt).getTime() <= Date.now()) {
                return API.v1.failure("Verification session expired");
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
    "medsense/registration.complete",
    { authRequired: false },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                token: String,
                verificationSession: String,
                name: String,
                email: String,
                username: String,
                pass: String,
                reason: String,
                phone: Match.Maybe(String),
                pharmacyId: Match.Maybe(String),
            }));

            const token = String(this.bodyParams.token).trim();
            const verificationSession = String(this.bodyParams.verificationSession).trim();
            const registration = await findRegistrationByToken(token);
            if (!registration) {
                return API.v1.failure("Registration link is invalid");
            }

            if (registration.status === "completed") {
                return API.v1.failure("Registration is already completed");
            }

            if (!registration.verificationSessionHash || !registration.verificationSessionExpiresAt) {
                return API.v1.failure("Verification session is missing");
            }

            const verificationSessionHash = hashRegistrationValue(verificationSession);
            if (!safeHashEqual(registration.verificationSessionHash, verificationSessionHash)) {
                return API.v1.failure("Verification session is invalid");
            }

            if (new Date(registration.verificationSessionExpiresAt).getTime() <= Date.now()) {
                return API.v1.failure("Verification session expired");
            }

            const name = String(this.bodyParams.name).trim();
            const email = String(this.bodyParams.email).trim().toLowerCase();
            const username = String(this.bodyParams.username).trim();
            const reason = String(this.bodyParams.reason).trim();
            const pass = String(this.bodyParams.pass);
            const phoneCandidate = this.bodyParams.phone
                ? String(this.bodyParams.phone)
                : registration.prefill?.phone || registration.phoneNumber;
            const normalizedPhone = normalizeRegistrationPhone(phoneCandidate || "");
            if (!normalizedPhone) {
                return API.v1.failure("error-invalid-phone-number");
            }

            if (!validateNameChars(name)) {
                return API.v1.failure("Name contains invalid characters");
            }

            if (!(await checkUsernameAvailability(username))) {
                return API.v1.failure("Username is already in use");
            }

            if (!(await checkEmailAvailability(email))) {
                return API.v1.failure("Email already exists");
            }

            let userId: string;
            try {
                const createdUser = await registerUser({ email, pass, name, reason, phone: normalizedPhone } as any);
                if (typeof createdUser !== "string") {
                    return API.v1.failure("Error creating user");
                }
                userId = createdUser;
                await setUsernameWithValidation(userId, username);
                await addUserRolesAsync(userId, ["user"]);
            } catch (error: any) {
                return API.v1.failure(error?.error || error?.message || "Error creating user");
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
            let specialtyStatus: string | undefined = specialtyActionId
                ? (hasPrecreatedSpecialty ? "invite_sent" : "pending")
                : undefined;
            let specialtyError: string | undefined;

            if (specialtyActionId && !hasPrecreatedSpecialty) {
                try {
                    const relayed = await relayMedsenseHubExecute(String(specialtyActionId), {
                        userId: registration.startedByUserId || userId,
                        username: registration.startedByUsername || username,
                        context: {
                            origin: "registration_complete",
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
                        if (typeof result?.roomId === "string") {
                            specialtyRoomId = result.roomId;
                        }
                        if (typeof result?.requestId === "string") {
                            specialtyRequestId = result.requestId;
                        }
                        specialtyStatus = typeof result?.status === "string"
                            ? result.status
                            : (specialtyRoomId ? "pending_room_link" : "pending");
                        if (typeof result?.error === "string") {
                            specialtyError = result.error;
                        }
                    } else {
                        specialtyStatus = "failed";
                        specialtyError = "Failed to execute specialty action";
                    }
                } catch (error: any) {
                    specialtyStatus = "failed";
                    specialtyError = error?.message || "Failed to execute specialty action";
                }
            }

            if (specialtyRoomId) {
                try {
                    const specialtyRoom = await Rooms.findOneById(String(specialtyRoomId));
                    if (!specialtyRoom) {
                        throw new Meteor.Error('error-invalid-room', 'Invalid specialty room');
                    }

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
                        await Rooms.setCustomFieldsById(
                            String(specialtyRoomId),
                            {
                                ...(specialtyRoom.customFields || {}),
                                patientId: userId,
                                patientUsername: username,
                            } as any,
                        );
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
            await MedsensePatientRegistrations.updateAsync(
                { _id: registration._id },
                {
                    $set: {
                        status: "completed",
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
                } as any,
            );

            return API.v1.success({
                success: true,
                userId,
                specialty: specialtyActionId
                    ? {
                        actionId: specialtyActionId,
                        flowId: specialtyActionId,
                        roomId: specialtyRoomId,
                        requestId: specialtyRequestId,
                        status: specialtyStatus || (specialtyRoomId ? "pending_room_link" : "pending"),
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
    "medsense/pharmacies.members.invite.sms",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                pharmacyId: String,
                phone: String,
                // role: String, // REMOVED: Implicitly 'staff'
                name: Match.Maybe(String),
                email: Match.Maybe(String),
            }));

            const { pharmacyId, phone, name, email } = this.bodyParams;

            // Role Normalization: Always staff
            // if (!['owner', 'manager', 'staff'].includes(role)) { ... }

            // Permissions
            // Global admin: Allowed
            // Owner: Can invite manager or staff
            // Manager: Can invite staff only
            // Block manager -> manager

            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
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
                return API.v1.failure("Invalid phone format. Must be E.164 (e.g. +1...)");
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
                        lastSentAt: now
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
                    lastSentAt: now
                });
            }

            // Re-fetch pharmacy name for SMS
            const pharmacy = await MedsensePharmacies.findOneById(pharmacyId);
            if (!pharmacy) {
                return API.v1.failure("Pharmacy not found");
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
                message: "Invite sent"
            });
        }
    }
);

API.v1.addRoute(
    "medsense/pharmacies.invites.list",
    { authRequired: true },
    {
        async get() {
            const pharmacyId = this.queryParams.pharmacyId as string;
            if (!pharmacyId) {
                return API.v1.failure("pharmacyId is required");
            }

            // Permission check: must be owner or manager of the pharmacy
            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
            if (!isGlobalAdmin) {
                const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
                if (!membership) return API.v1.forbidden();

                const isOwnerOrManager = membership.roles.includes('owner') || membership.roles.includes('manager');
                if (!isOwnerOrManager) return API.v1.forbidden();
            }

            const invites = await MedsensePharmacyInvites.findAllByPharmacy(pharmacyId);
            console.log('Invites list params:', this.queryParams); // Debug 400 error

            return API.v1.success({
                invites: invites.map(inv => {
                    let status = inv.status;
                    if (status === 'pending' && new Date(inv.expiresAt) < new Date()) {
                        status = 'expired';
                    }
                    return {
                        ...inv,
                        status
                    };
                })
            });
        }
    }
);

API.v1.addRoute(
    "medsense/pharmacies.members.verify",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                inviteId: String,
                code: String,
            }));

            const { inviteId, code } = this.bodyParams;

            const invite = await MedsensePharmacyInvites.findOneById(inviteId);
            if (!invite) {
                return API.v1.failure("Invite not found");
            }

            if (invite.status !== 'pending') {
                return API.v1.failure("Invite is no longer valid");
            }

            const now = new Date();
            if (invite.expiresAt < now) {
                await MedsensePharmacyInvites.updateStatus(inviteId, 'expired');
                return API.v1.failure("Invite expired");
            }

            if (invite.code !== code) {
                return API.v1.failure("Invalid code");
            }

            // Check if already member
            const existingMember = await MedsensePharmacyMemberships.findOne({ pharmacyId: invite.pharmacyId, userId: this.userId });
            if (existingMember) {
                return API.v1.failure("You are already a member of this pharmacy");
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
            const globalRole = (invite.role === 'owner' || invite.role === 'manager') ? 'pharmacy-manager' : 'pharmacy-staff';
            await addUserRolesAsync(this.userId, [globalRole]);

            // Mark Invite Accepted
            await MedsensePharmacyInvites.updateStatus(inviteId, 'accepted', {
                acceptedBy: this.userId,
                acceptedAt: now
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
                pharmacyName: pharmacy?.name || "Unknown Pharmacy",
                role: invite.role
            });
        }
    }
);

API.v1.addRoute(
    "medsense/pharmacies.members.update",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                pharmacyId: String,
                userId: String,
                roles: [String]
            }));
            const { pharmacyId, userId, roles } = this.bodyParams;

            // Permissions
            const isGlobalAdmin = await hasPermissionAsync(this.userId, "medsense-manage-all-pharmacies");
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
                return API.v1.failure("Member not found");
            }

            // Prevent removing last owner
            if (targetMembership.roles.includes('owner') && !roles.includes('owner')) {
                const owners = await MedsensePharmacyMemberships.find({ pharmacyId, roles: 'owner' }).toArray();
                if (owners.length <= 1) {
                    return API.v1.failure("Cannot demote the last owner.");
                }
            }

            await MedsensePharmacyMemberships.updateOne(
                { pharmacyId, userId },
                {
                    $set: {
                        roles,
                        updatedAt: new Date()
                    }
                }
            );

            // Update Global Role
            if (roles.includes('owner') || roles.includes('manager')) {
                await addUserRolesAsync(userId, ['pharmacy-manager']);
                await removeUserFromRolesAsync(userId, ['pharmacy-staff']);
            } else {
                const otherManaged = await MedsensePharmacyMemberships.find({
                    userId,
                    pharmacyId: { $ne: pharmacyId },
                    roles: { $in: ['owner', 'manager'] }
                }).toArray();

                if (otherManaged.length === 0) {
                    await addUserRolesAsync(userId, ['pharmacy-staff']);
                    await removeUserFromRolesAsync(userId, ['pharmacy-manager']);
                }
            }

            return API.v1.success();
        }
    }
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
        const latestReq = await MedsenseRequests.findOne(
            { roomId },
            { sort: { createdAt: -1 }, projection: { requestedByUserId: 1 } },
        );
        patientUserId = latestReq?.requestedByUserId;
    }

    if (!patientUserId) {
        const members = await Subscriptions.findByRoomId(roomId).toArray();
        const memberIds = members.map((m) => m.u?._id).filter(Boolean) as string[];
        if (memberIds.length) {
            const candidates = await Users.find(
                { _id: { $in: memberIds }, roles: { $in: ['user'] } },
                { projection: { roles: 1 } },
            ).toArray();
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
            check(this.queryParams, Match.ObjectIncluding({
                roomId: String,
                patientUserId: Match.Optional(String),
            }));

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
                    medsenseSessionInfo: 1,
                },
            });
            if (!room) {
                return API.v1.failure('Room not found');
            }

            let request = room.medsenseActiveRequestId
                ? await MedsenseRequests.findOneById(room.medsenseActiveRequestId)
                : null;
            if (!request) {
                request = await MedsenseRequests.findOne(
                    { roomId },
                    { sort: { createdAt: -1 } },
                );
            }

            const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
            let pharmacyId = request?.pharmacyId;

            if (!pharmacyId && patientUserId) {
                const preference = await MedsensePatientPharmacy.findByPatientUserId(patientUserId);
                pharmacyId = preference?.pharmacyId;
            }

            const [patient, pharmacy] = await Promise.all([
                patientUserId
                    ? Users.findOneById(patientUserId, { projection: { name: 1, username: 1 } })
                    : Promise.resolve(null),
                pharmacyId
                    ? MedsensePharmacies.findOneById(pharmacyId)
                    : Promise.resolve(null),
            ]);

            const patientName = patient?.name || patient?.username || undefined;
            const pharmacyName = pharmacy?.name || undefined;
            const roomContextSummaries = Array.isArray((room as any)?.medsenseSessionInfo?.roomContextSummaries)
                ? (room as any).medsenseSessionInfo.roomContextSummaries
                : [];
            const latestRoomSummary = roomContextSummaries.length
                ? roomContextSummaries[roomContextSummaries.length - 1]
                : undefined;
            const aiSummary =
                request?.aiSummary ||
                request?.contextSummary ||
                (typeof latestRoomSummary?.summary === 'string' ? latestRoomSummary.summary : '');

            const interventions = patientUserId
                ? await MedsenseInterventions.findByPatientUserId(patientUserId, pharmacyId).toArray()
                : [];

            const subscriptions = await Subscriptions.findByRoomId(roomId, {
                projection: { u: 1 },
            }).toArray();
            const memberIds = subscriptions.map((sub) => sub.u?._id).filter(Boolean) as string[];
            let staffCount = 0;
            if (memberIds.length) {
                const members = await Users.find(
                    { _id: { $in: memberIds } },
                    { projection: { roles: 1 } },
                ).toArray();
                staffCount = members.filter((member) => {
                    const roles = Array.isArray(member.roles) ? member.roles : [];
                    if (!roles.length) {
                        return false;
                    }
                    if (roles.includes('bot') || roles.includes('app')) {
                        return false;
                    }
                    return !roles.every((role) => role === 'user');
                }).length;
            }

            return API.v1.success({
                context: {
                    requestId: request?._id,
                    requestStatus: request?.status || room.medsenseActiveRequestStatus || undefined,
                    pharmacyId,
                    pharmacyName,
                    patientUserId: patientUserId || undefined,
                    patientName,
                    aiSummary,
                    staffCount,
                    activeInterventions: interventions,
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
            check(this.queryParams, Match.ObjectIncluding({
                roomId: String,
                patientUserId: Match.Optional(String),
            }));

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
                },
            });
            if (!room) {
                return API.v1.failure('Room not found');
            }

            let request = room.medsenseActiveRequestId
                ? await MedsenseRequests.findOneById(room.medsenseActiveRequestId)
                : null;
            if (!request) {
                request = await MedsenseRequests.findOne(
                    { roomId },
                    { sort: { createdAt: -1 } },
                );
            }

            const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
            let pharmacyId = request?.pharmacyId;

            if (!pharmacyId && patientUserId) {
                const preference = await MedsensePatientPharmacy.findByPatientUserId(patientUserId);
                pharmacyId = preference?.pharmacyId;
            }

            const [patient, pharmacy] = await Promise.all([
                patientUserId
                    ? Users.findOneById(patientUserId, { projection: { name: 1, username: 1 } })
                    : Promise.resolve(null),
                pharmacyId
                    ? MedsensePharmacies.findOneById(pharmacyId)
                    : Promise.resolve(null),
            ]);

            const patientName = patient?.name || patient?.username || undefined;
            const pharmacyName = pharmacy?.name || undefined;

            const subscriptions = await Subscriptions.findByRoomId(roomId, {
                projection: { u: 1 },
            }).toArray();
            const memberIds = subscriptions.map((sub) => sub.u?._id).filter(Boolean) as string[];
            let staffCount = 0;
            if (memberIds.length) {
                const members = await Users.find(
                    { _id: { $in: memberIds } },
                    { projection: { roles: 1 } },
                ).toArray();
                staffCount = members.filter((member) => {
                    const roles = Array.isArray(member.roles) ? member.roles : [];
                    if (!roles.length) {
                        return false;
                    }
                    if (roles.includes('bot') || roles.includes('app')) {
                        return false;
                    }
                    return !roles.every((role) => role === 'user');
                }).length;
            }

            return API.v1.success({
                context: {
                    roomId,
                    requestId: request?._id,
                    requestStatus: request?.status || room.medsenseActiveRequestStatus || undefined,
                    specialtyActionId: request?.specialtyActionId || undefined,
                    patientUserId: patientUserId || undefined,
                    patientName,
                    pharmacyId,
                    pharmacyName,
                    staffCount,
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
            check(this.bodyParams, Match.ObjectIncluding({
                pharmacyId: String,
                patientUserId: String,
                type: String,
                specialtyActionId: Match.Optional(String),
                notes: Match.Optional(String),
            }));

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
            check(this.queryParams, Match.ObjectIncluding({
                interventionId: String,
            }));

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
            check(this.bodyParams, Match.ObjectIncluding({
                interventionId: String,
                text: String,
            }));

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
            check(this.queryParams, Match.ObjectIncluding({
                patientUserId: String,
                pharmacyId: Match.Optional(String),
            }));

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

            check(this.bodyParams, Match.ObjectIncluding({
                patientUserId: String,
                roomId: String,
                candidates: [Match.Any],
                limitPerCandidate: Match.Optional(Number),
            }));

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
                                vocab: String(u.vocab || '').trim().toUpperCase(),
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

            check(this.bodyParams, Match.ObjectIncluding({
                patientUserId: String,
                roomId: String,
            }));

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

                const selectedVocab = String((raw as any).selectedVocab || '').trim().toUpperCase();
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

                const sourceRaw = String((raw as any).source || 'session_rollup').trim().toLowerCase();
                const source = (VALID_CONTEXT_SOURCES.includes(sourceRaw as any) ? sourceRaw : 'session_rollup') as typeof VALID_CONTEXT_SOURCES[number];

                const result = await MedsensePatientContext.upsertEntityWithNote({
                    patientUserId,
                    type: type as typeof VALID_CONTEXT_TYPES[number],
                    entityName,
                    cui: selectedCui,
                    vocab: selectedVocab as typeof VALID_CONTEXT_VOCABS[number],
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

                const action = String((raw as any).action || '').trim().toLowerCase();
                const targetEntryId = String((raw as any).targetEntryId || '').trim();
                const summary = String((raw as any).summary || '').trim();
                let typeRaw = String((raw as any).type || '').trim();
                typeRaw = TYPE_NORMALIZATION[typeRaw] || typeRaw;
                const type = typeRaw ? typeRaw.toLowerCase() : '';
                const sourceRaw = String((raw as any).source || 'session_rollup').trim().toLowerCase();
                const source = (VALID_CONTEXT_SOURCES.includes(sourceRaw as any) ? sourceRaw : 'session_rollup') as typeof VALID_CONTEXT_SOURCES[number];

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
                        type: type as typeof VALID_CONTEXT_TYPES[number],
                        entityName: summary,
                        cui: _legacyCui(type, summary),
                        vocab: vocab as typeof VALID_CONTEXT_VOCABS[number],
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


const _defaultSessionInfo = () => ({
    version: 1,
    assignedAgent: null as string | null,
    sessionStartMsgId: null as string | null,
    sessionStartTs: null as string | null,
    lastActivityTs: null as string | null,
    lastAssessedMsgId: null as string | null,
    sessionBuffer: [] as Array<Record<string, any>>,
    sessionForms: [] as Array<Record<string, any>>,
    roomFormSubmissions: [] as Array<Record<string, any>>,
    roomContextSummaries: [] as Array<Record<string, any>>,
    summary: {
        text: '',
        updatedAt: null as string | null,
    },
});

const _normalizeSessionInfo = (raw: any) => {
    const base = _defaultSessionInfo();
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = {
        ...base,
        ...source,
    };
    normalized.sessionBuffer = Array.isArray(source.sessionBuffer) ? source.sessionBuffer : base.sessionBuffer;
    normalized.sessionForms = Array.isArray(source.sessionForms) ? source.sessionForms : base.sessionForms;
    normalized.roomFormSubmissions = Array.isArray(source.roomFormSubmissions) ? source.roomFormSubmissions : base.roomFormSubmissions;
    normalized.roomContextSummaries = Array.isArray(source.roomContextSummaries)
        ? source.roomContextSummaries
        : base.roomContextSummaries;
    normalized.summary = source.summary && typeof source.summary === 'object'
        ? {
            text: typeof source.summary.text === 'string' ? source.summary.text : '',
            updatedAt: typeof source.summary.updatedAt === 'string' ? source.summary.updatedAt : null,
        }
        : base.summary;
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
                projection: { medsenseSessionInfo: 1 },
            });
            if (!room) {
                return API.v1.failure('Room not found');
            }

            return API.v1.success({
                sessionInfo: _normalizeSessionInfo((room as any).medsenseSessionInfo),
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
                    'medsenseSessionInfo.assignedAgent': { $exists: true, $ne: null },
                },
                {
                    projection: {
                        medsenseSessionInfo: 1,
                        medsenseActiveRequestId: 1,
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
                        assignedAgent: sessionInfo.assignedAgent,
                        lastActivityTs,
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
            check(this.bodyParams, Match.ObjectIncluding({
                roomId: String,
                isTyping: Boolean,
            }));

            if (!(await hasPermissionAsync(this.userId, 'medsense-create-interventions'))) {
                const user = await Users.findOneById(this.userId, { projection: { roles: 1 } });
                const roles = user?.roles || [];
                if (!roles.includes('admin') && !roles.includes('bot')) {
                    return API.v1.forbidden();
                }
            }

            const roomId = String(this.bodyParams.roomId);
            const isTyping = Boolean((this.bodyParams as any).isTyping);
            const room = await Rooms.findOneById(roomId, { projection: { _id: 1 } });
            if (!room) {
                return API.v1.failure('Room not found');
            }

            notifications.notifyRoom(roomId, 'user-activity', 'MedSense', isTyping ? ['user-typing'] : []);

            return API.v1.success({
                roomId,
                isTyping,
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
            check(this.bodyParams, Match.ObjectIncluding({
                roomId: String,
                sessionInfo: Match.ObjectIncluding({}),
            }));

            const roomId = String(this.bodyParams.roomId);
            const incoming = (this.bodyParams as any).sessionInfo || {};

            const room = await Rooms.findOneById(roomId, {
                projection: { medsenseSessionInfo: 1 },
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
            if ('roomContextSummaries' in incoming) {
                next.roomContextSummaries = Array.isArray(incoming.roomContextSummaries) ? incoming.roomContextSummaries : [];
            }
            if ('summary' in incoming) {
                next.summary = incoming.summary && typeof incoming.summary === 'object'
                    ? {
                        text: typeof incoming.summary.text === 'string' ? incoming.summary.text : '',
                        updatedAt: typeof incoming.summary.updatedAt === 'string' ? incoming.summary.updatedAt : null,
                    }
                    : current.summary;
            }

            await Rooms.update(
                { _id: roomId },
                { $set: { medsenseSessionInfo: next } },
            );

            return API.v1.success({ sessionInfo: next });
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

            check(this.bodyParams, Match.ObjectIncluding({
                fileName: String,
                fileContent: String,
                force: Match.Optional(Boolean),
            }));

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

            check(this.queryParams, Match.ObjectIncluding({
                roomId: String,
                keywords: Match.Optional(String),
                limit: Match.Optional(String),
                patientUserId: Match.Optional(String),
            }));

            const roomId = String(this.queryParams.roomId);
            const keywords = typeof this.queryParams.keywords === 'string' ? this.queryParams.keywords : '';
            const limit = Math.min(parseInt(this.queryParams.limit || '3', 10) || 3, 5);

            const room = await Rooms.findOneById(roomId, {
                projection: {
                    medsenseSessionInfo: 1,
                    medsenseActiveRequestId: 1,
                },
            });
            if (!room) {
                return API.v1.failure('Room not found');
            }

            const patientUserId = await _resolvePatientUserIdForRoom(roomId, this.queryParams.patientUserId as string | undefined);
            if (!patientUserId) {
                return API.v1.success({ context: null });
            }

            const sessionInfo = (room as any).medsenseSessionInfo || {};
            const sessionBuffer = Array.isArray(sessionInfo.sessionBuffer) ? sessionInfo.sessionBuffer : [];
            const sessionBufferTail = sessionBuffer.slice(-2);

            const roomContextSummaries = Array.isArray(sessionInfo.roomContextSummaries) ? sessionInfo.roomContextSummaries : [];
            const roomContextSummary = roomContextSummaries.length
                ? roomContextSummaries[roomContextSummaries.length - 1]
                : null;
            const roomFormSubmissions = Array.isArray(sessionInfo.roomFormSubmissions) ? sessionInfo.roomFormSubmissions : [];

            let patientContextMatches = [] as any[];
            if (keywords && keywords.trim()) {
                patientContextMatches = await MedsensePatientContext.searchByPatient(patientUserId, keywords.trim(), limit);
            } else {
                patientContextMatches = await MedsensePatientContext.findRecentByPatient(patientUserId, limit).toArray();
            }

            patientContextMatches = (patientContextMatches || []).map((entry: any) => {
                const notes = Array.isArray(entry?.notes) ? entry.notes : [];
                const latest = notes.length ? notes[notes.length - 1] : undefined;
                return {
                    ...entry,
                    summary: _legacySummary(entry),
                    roomId: entry?.roomId || latest?.roomId || null,
                    source: entry?.source || latest?.source || null,
                    tags: Array.isArray(entry?.tags) ? entry.tags : [],
                };
            });

            return API.v1.success({
                patientUserId,
                sessionBufferTail,
                roomContextSummary,
                roomFormSubmissions,
                patientContextMatches,
            });
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

            check(this.bodyParams, Match.ObjectIncluding({
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
            }));

            let normalizedTemplate: Partial<IMedsenseDocumentationTemplate>;
            try {
                normalizedTemplate = normalizeDocumentationTemplateInput(this.bodyParams);
            } catch (error: any) {
                return API.v1.failure(error?.message || 'Invalid template definition');
            }

            const { key, label, description, interventionTypes, specialtyActionIds, sections, signatureRules, pdfConfig } = normalizedTemplate as any;

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
            return API.v1.success({ template: template ? await hydrateTemplateDrugFieldOptions(template as IMedsenseDocumentationTemplate) : template });
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

            check(this.bodyParams, Match.ObjectIncluding({
                templateId: String,
                updateData: Object,
            }));

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
            return API.v1.success({ template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated });
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

            await MedsenseDocumentationTemplates.updateOne(
                { _id: templateId },
                { $set: { status: 'active', _updatedAt: new Date() } },
            );

            const updated = await MedsenseDocumentationTemplates.findOneById(templateId);
            return API.v1.success({ template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated });
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

            await MedsenseDocumentationTemplates.updateOne(
                { _id: templateId },
                { $set: { status: 'inactive', _updatedAt: new Date() } },
            );

            const updated = await MedsenseDocumentationTemplates.findOneById(templateId);
            return API.v1.success({ template: updated ? await hydrateTemplateDrugFieldOptions(updated as IMedsenseDocumentationTemplate) : updated });
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
            return API.v1.success({ template: duplicated ? await hydrateTemplateDrugFieldOptions(duplicated as IMedsenseDocumentationTemplate) : duplicated });
        },
    },
);

// --- Documentation Templates Runtime APIs ---

API.v1.addRoute(
    'medsense/interventions.documentation.launch',
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                interventionId: String,
                templateId: Match.Optional(String),
                roomId: Match.Optional(String),
                appContextId: Match.Optional(String),
            }));

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

            let template = intervention.documentationTemplateSnapshot || (intervention.documentationTemplateId ? await MedsenseDocumentationTemplates.findOneById(intervention.documentationTemplateId) : null);
            if (!template && requestedTemplateId) {
                const selectedTemplate = await MedsenseDocumentationTemplates.findOneById(requestedTemplateId);
                if (!selectedTemplate || selectedTemplate.status !== 'active') {
                    return API.v1.failure('Template not found or inactive');
                }
                if (Array.isArray(selectedTemplate.interventionTypes) && selectedTemplate.interventionTypes.length && !selectedTemplate.interventionTypes.includes(intervention.type)) {
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
            check(this.bodyParams, Match.ObjectIncluding({
                interventionId: String,
                roomId: Match.Optional(String),
                forceRefresh: Match.Optional(Boolean),
            }));
            const { interventionId, roomId, forceRefresh } = this.bodyParams as any;

            const intervention = await MedsenseInterventions.findOneById(interventionId);
            if (!intervention) {
                return API.v1.failure('Intervention not found');
            }

            if (!(await canAccessInterventionDocumentation(this.userId, intervention))) {
                return API.v1.forbidden();
            }

            const template = intervention.documentationTemplateSnapshot
                || (intervention.documentationTemplateId
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
            const prefillResponse = await callDocumentationPrefillWebhook({
                roomId: typeof roomId === 'string' ? roomId : context.roomId,
                requestId,
                intervention,
                template: hydratedTemplate,
                context,
                forceRefresh: Boolean(forceRefresh),
            });
            const appliedDraft = applyDocumentationPrefillResults({
                template: hydratedTemplate,
                baseDocumentationValues: draftValues.documentationValues,
                basePrescriptions: draftValues.prescriptions,
                baseFollowUp: draftValues.followUp,
                prefillResponse,
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
                template: updated?.documentationTemplateSnapshot ? await hydrateTemplateDrugFieldOptions(updated.documentationTemplateSnapshot) : hydratedTemplate,
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
    'medsense/interventions.documentation.saveDraft',
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({
                interventionId: String,
                documentationValues: Match.Optional(Object),
                prescriptions: Match.Optional([Object]),
                followUp: Match.Optional(Object),
                documentationPrefill: Match.Optional(Object),
            }));

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

            const hasPendingSuggestions = Array.isArray(intervention.documentationPrefill?.fields)
                && intervention.documentationPrefill.fields.some((field: any) => field?.reviewStatus === 'pending');
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

            check(this.bodyParams, Match.ObjectIncluding({
                interventionId: String,
                role: String,
                signatureImageData: String,
                signerName: Match.Optional(String),
            }));

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
                    name: role === 'patient' ? String(signerName).trim() : (user?.name || user?.username || 'Unknown'),
                    role,
                    signedAt: new Date(),
                    signatureImageData,
                },
            };

            const pharmacistSigned = Boolean(nextSignatures.pharmacist);
            const patientSigned = Boolean(nextSignatures.patient);
            const documentationStatus = (!templateSnapshot.signatureRules.requirePharmacistSignature || pharmacistSigned)
                && (!templateSnapshot.signatureRules.requirePatientSignature || patientSigned)
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
