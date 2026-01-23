import { api } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { MedsenseRequests, Permissions, Roles, Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

import { callbacks } from '../../../../server/lib/callbacks';
import { settingsRegistry, settings } from '../../../settings/server';
import { sendMessage } from '../functions/sendMessage';

export const addMedsenseSettings = async function (): Promise<void> {
    await settingsRegistry.addGroup('Message', async function () {
        await this.section('Medsense', async function () {
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
    await Permissions.create('medsense-manage-pharmacies', ['admin']);
    await Permissions.create('medsense-manage-own-pharmacy', ['admin', 'pharmacy-manager']);
    await Permissions.create('medsense-view-pharmacy-members', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
    await Permissions.create('medsense-invite-pharmacy-staff', ['admin', 'pharmacy-manager']);

    // Medsense Queue Permissions (Request-Record)
    await Permissions.create('medsense-view-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
    await Permissions.create('medsense-take-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
    await Permissions.create('medsense-close-request', ['admin', 'pharmacy-manager', 'pharmacy-staff']);
    await Permissions.create('medsense-view-hub', ['admin']);
};

// Legacy stubs (Settings removed)
const getStaffRoles = (): string[] => [];
const userHasStaffRole = (_user: any, _staffRoles: any): boolean => false;
const getRoomStaffCount = async (_roomId: string, _staffRoles: string[], _excludeUserId?: string): Promise<number> => 0;

const markRoomTaken = async (room: IRoom, user: IUser): Promise<void> => {
    const requestId = room.medsenseActiveRequestId;
    if (!requestId) return;

    const request = await MedsenseRequests.findOneById(requestId);
    if (!request || request.status !== 'pending') return;

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
            if (roomData.medsenseActiveRequestStatus !== 'pending' || !roomData.medsenseActiveRequestId) {
                return;
            }

            await markRoomTaken(roomData as IRoom, user);
        },
        callbacks.priority.LOW,
        'medsense-pending-queue-added',
    );

    // Auto-close on leave REMOVED (Manual close only)
};

Meteor.startup(async () => {
    await addMedsenseSettings();
    registerMedsensePendingCallbacks();
});
