import { api } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import {
    MedsenseRequests,
    Rooms,
    Permissions,
    MedsenseDocumentationTemplates,
    Roles,
    Subscriptions,
    Users,
} from '@rocket.chat/models';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

import { callbacks } from '../../../../server/lib/callbacks';
import { settingsRegistry, settings } from '../../../settings/server';
import { sendMessage } from '../functions/sendMessage';

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
                ...botUsers.map(u => ({ key: u.username || '', i18nLabel: u.username || '' })).filter(u => u.key !== '')
            ];

            // Fallback if no bots found (or just "bot" user isn't tagged with role yet)
            if (!botUserValues.find(v => v.key === 'bot')) {
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

            await this.add('Medsense_Queue_Status_Colors', '{"waiting_patient":"warning","ai_preassessment":"secondary","waiting_staff":"warning","ready_for_staff":"featured","taken":"primary","closed":"secondary"}', {
                type: 'string',
                public: true,
                multiline: true,
                i18nLabel: 'Medsense_Queue_Status_Colors',
                i18nDescription: 'Medsense_Queue_Status_Colors_Description',
            });

            await this.add('Medsense_Intervention_Types', '[{\"value\":\"uti\",\"label\":\"UTI Assessment\"},{\"value\":\"counseling\",\"label\":\"Counseling\"},{\"value\":\"medication_review\",\"label\":\"Medication Review\"},{\"value\":\"refill_request\",\"label\":\"Refill Request\"},{\"value\":\"drug_interaction\",\"label\":\"Drug Interaction\"},{\"value\":\"adverse_event\",\"label\":\"Adverse Event\"},{\"value\":\"other\",\"label\":\"Other\"}]', {
                type: 'string',
                public: false,
                multiline: true,
                i18nLabel: 'Medsense_Intervention_Types',
                i18nDescription: 'Medsense_Intervention_Types_Description',
            });

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
        { _id: 'pharmacy-staff', name: 'Pharmacy Staff', scope: 'Users', description: 'Staff member of a Pharmacy' }
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
                medsenseActiveRequestStatus: 'taken'
            }
        }
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
        medsenseActiveRequestStatus: 'taken'
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
            if (!['waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(roomData.medsenseActiveRequestStatus ?? '') || !roomData.medsenseActiveRequestId) {
                return;
            }

            await markRoomTaken(roomData as IRoom, user);
        },
        callbacks.priority.LOW,
        'medsense-pending-queue-added',
    );

    // Auto-close on leave REMOVED (Manual close only)
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
                        { key: 'patient_name', label: 'Patient Name', type: 'text', required: true, sourceKey: 'patient.name', visibleInPdf: true, sortOrder: 0 },
                        { key: 'patient_username', label: 'Patient Username', type: 'text', required: false, sourceKey: 'patient.username', visibleInPdf: true, sortOrder: 1 },
                        { key: 'patient_email', label: 'Patient Email', type: 'text', required: false, sourceKey: 'patient.email', visibleInPdf: true, sortOrder: 2 },
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
                        { key: 'presenting_concern', label: 'Presenting Concern', type: 'textarea', required: true, sourceKey: 'request.reason', visibleInPdf: true, sortOrder: 0 },
                        { key: 'symptoms', label: 'Symptoms', type: 'textarea', required: true, sourceKey: 'request.contextSummary', visibleInPdf: true, sortOrder: 1 },
                    ],
                },
                {
                    key: 'assessment',
                    title: 'Clinical Assessment',
                    type: 'assessment',
                    sortOrder: 2,
                    visibleInPdf: true,
                    fields: [
                        { key: 'ai_summary', label: 'AI Summary', type: 'textarea', required: false, sourceKey: 'request.aiSummary', visibleInPdf: true, sortOrder: 0 },
                        { key: 'red_flags', label: 'Red Flags Present?', type: 'boolean', required: true, visibleInPdf: true, sortOrder: 1 },
                        { key: 'red_flags_details', label: 'Red Flags Details', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 2 },
                        { key: 'clinical_assessment', label: 'Clinical Assessment', type: 'textarea', required: true, visibleInPdf: true, sortOrder: 3 },
                    ],
                },
                {
                    key: 'action_plan',
                    title: 'Action & Plan',
                    type: 'action_taken',
                    sortOrder: 3,
                    visibleInPdf: true,
                    fields: [
                        { key: 'action_taken', label: 'Action Taken', type: 'select', options: ['Prescribed', 'Referred to MD', 'OTC Recommendation', 'Education Only'], required: true, visibleInPdf: true, sortOrder: 0 },
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
                        { key: 'provider_contact_notes', label: 'Provider Communication Notes', type: 'textarea', required: false, visibleInPdf: true, sortOrder: 1 },
                    ],
                },
                {
                    key: 'prescriptions',
                    title: 'Prescription',
                    type: 'prescriptions',
                    sortOrder: 5,
                    visibleInPdf: true,
                    fields: [
                        { key: 'drug_name', label: 'Drug', type: 'drug', required: true, visibleInPdf: true, sortOrder: 0, drugCatalogCodes: [], options: [] },
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
        return;
    }

    if (!Array.isArray((existingUTI as any).interventionTypes)
        || !(existingUTI as any).interventionTypes.length
        || ((existingUTI as any).interventionTypes.length === 1 && (existingUTI as any).interventionTypes[0] === 'other')) {
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
};

Meteor.startup(async () => {
    await addMedsenseSettings();
    await seedMedsenseDocumentationTemplates();
    registerMedsensePendingCallbacks();
});
