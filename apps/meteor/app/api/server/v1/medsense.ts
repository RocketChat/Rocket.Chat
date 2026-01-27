import { api, OmnichannelIntegration } from "@rocket.chat/core-services";
import {
    MedsensePharmacies,
    MedsensePharmacyMemberships,
    MedsensePatientPharmacy,
    MedsenseRequests,
    Users,
    Rooms
} from "@rocket.chat/models";
import { check, Match } from "meteor/check";
import { HTTP } from "meteor/http";
import { Meteor } from "meteor/meteor";
import { Apps } from '@rocket.chat/apps';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';

import { hasAtLeastOnePermissionAsync, hasPermissionAsync } from "../../../authorization/server/functions/hasPermission";
import { addUserToRoom } from "../../../lib/server/functions/addUserToRoom";
import { removeUserFromRoom } from "../../../lib/server/functions/removeUserFromRoom";
import { sendMessage } from "../../../lib/server/functions/sendMessage";
import { settings } from '../../../settings/server';
import { API } from "../api";

// Pharmacies Management (Kept Intact)
API.v1.addRoute(
    "medsense/pharmacies.list",
    { authRequired: true },
    {
        async get() {
            const manageAll = await hasPermissionAsync(this.userId, "medsense-manage-pharmacies");
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

            const manageAll = await hasPermissionAsync(this.userId, "medsense-manage-pharmacies");
            const manageOwn = await hasPermissionAsync(this.userId, "medsense-manage-own-pharmacy");

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
                { active: true },
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
            if (!(await hasPermissionAsync(this.userId, "medsense-manage-pharmacies"))) {
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

            // Add creator as manager
            await MedsensePharmacyMemberships.insertOne({
                pharmacyId,
                userId: this.userId,
                roles: ["manager"],
                active: true,
                createdBy: this.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

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
            if (!(await hasPermissionAsync(this.userId, "medsense-manage-pharmacies"))) {
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
API.v1.addRoute(
    "medsense/pharmacies.members.list",
    { authRequired: true },
    {
        async get() {
            check(this.queryParams, Match.ObjectIncluding({ pharmacyId: String }));
            const { pharmacyId } = this.queryParams;

            const isManager = await hasPermissionAsync(this.userId, "medsense-manage-pharmacies");
            const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });

            if (!isManager && !membership) {
                return API.v1.forbidden();
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

            const isAdmin = await hasPermissionAsync(this.userId, "medsense-manage-pharmacies");
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

            const isAdmin = await hasPermissionAsync(this.userId, "medsense-manage-pharmacies");
            if (!isAdmin) {
                const membership = await MedsensePharmacyMemberships.findOne({ pharmacyId, userId: this.userId });
                if (!membership || !membership.roles.includes("manager")) {
                    return API.v1.forbidden();
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

            if (!(await hasPermissionAsync(this.userId, "medsense-manage-pharmacies"))) {
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

            if (status) {
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
            if (!request || !['waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(request.status)) {
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
    "medsense/request.close",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({ requestId: String }));
            const { requestId } = this.bodyParams;

            if (!(await hasPermissionAsync(this.userId, 'medsense-close-request'))) {
                return API.v1.forbidden();
            }

            const request = await MedsenseRequests.findOneById(requestId);
            if (!request || request.status === 'closed') {
                return API.v1.failure("Request not found or already closed");
            }

            const room = await Rooms.findOneById(request.roomId);
            if (!room?.t) {
                return API.v1.failure("Room type missing for request room");
            }

            try {
                await removeUserFromRoom(request.roomId, this.user);
            } catch (error: any) {
                return API.v1.failure(`Failed to remove user from room: ${error?.message ?? error}`);
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

            // System Message
            await sendMessage(this.user, {
                rid: request.roomId,
                msg: `Request closed by @${this.user.username}`,
            }, room);

            api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null });

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
            if (!request || !['waiting_patient', 'ai_preassessment', 'waiting_staff', 'ready_for_staff'].includes(request.status)) {
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
            await sendMessage(messageUser, {
                rid: request.roomId,
                msg: declineText,
            }, room);

            api.broadcast('room.save', { _id: request.roomId, medsenseActiveRequestStatus: null });

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

            // Dynamic Discovery: Find all apps that support hub.actions
            if (!Apps.self?.isInitialized()) {
                return API.v1.success({ actions: [] });
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

                const promises = enabledApps.map(async (app) => {
                    const appId = app.getID();
                    try {
                        const url = Meteor.absoluteUrl(`api/apps/public/${appId}/hub.actions`);
                        console.warn(`[Medsense] Hub Discovery: Probing ${appId} -> ${url}`);

                        const response = await HTTP.get(url, { timeout: 2000, throwError: false });

                        if (response.statusCode === 200 && response.data && response.data.actions) {
                            console.warn(`[Medsense] Hub Discovery: Found actions for ${appId}`);
                            return response.data.actions.map((action: any) => ({
                                ...action,
                                id: `${appId}:${action.id}`
                            }));
                        }
                        if (response.statusCode === 404 || response.statusCode === 401 || response.statusCode === 403) {
                            console.warn(`[Medsense] Hub Discovery: ${appId} skipped (${response.statusCode})`);
                            return [];
                        }
                    } catch (e) {
                        const error = e as any;
                        if (error.response?.statusCode === 404 || error.statusCode === 404) {
                            console.warn(`[Medsense] Hub Discovery: ${appId} skipped (No hub endpoint)`);
                        } else {
                            console.warn(`[Medsense] Hub Discovery Error for ${appId}:`, error.message);
                        }
                    }
                    return [];
                });

                const results = await Promise.all(promises);
                const actions = results.flat();

                return API.v1.success({ actions });
            } catch (error) {
                console.error('Medsense Hub Discovery Error:', error);
                return API.v1.success({ actions: [] });
            }
        },
    },
);

API.v1.addRoute(
    "medsense/hub.execute",
    { authRequired: true },
    {
        async post() {
            check(this.bodyParams, Match.ObjectIncluding({ actionId: String }));
            const { actionId } = this.bodyParams; // Expected format: appId:actionId

            if (!(await hasPermissionAsync(this.userId, 'medsense-view-hub'))) {
                return API.v1.forbidden();
            }

            const separatorIndex = actionId.indexOf(':');
            if (separatorIndex === -1) {
                return API.v1.failure('Invalid actionId format');
            }

            const appId = actionId.substring(0, separatorIndex);
            const realActionId = actionId.substring(separatorIndex + 1);

            try {
                // Relay to specific App
                const url = Meteor.absoluteUrl(`api/apps/public/${appId}/hub.execute`);
                const response = await HTTP.post(url, {
                    data: {
                        actionId: realActionId,
                        userId: this.userId,
                        username: this.user?.username,
                    },
                    throwError: false,
                });

                if (response.statusCode !== 200 || !response.data) {
                    return API.v1.failure('Failed to execute action via Hub App');
                }

                return API.v1.success({ view: response.data.view });
            } catch (error) {
                console.error('Medsense Hub Error:', error);
                return API.v1.failure('Error executing hub action');
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
