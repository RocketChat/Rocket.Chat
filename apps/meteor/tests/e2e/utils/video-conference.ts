import type { APIRequestContext } from '@playwright/test';

import type { BaseTest } from './test';
import { expect } from './test';
import { BASE_API_URL } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

export type JoinableCall = { callId: string; name: string; joined: boolean };

const asUser = (user: IUserState) => ({ 'X-Auth-Token': user.data.loginToken, 'X-User-Id': user.data._id });

/** The calls `user` would be offered in the navbar right now — what the ongoing-calls button counts. */
export const listJoinableCalls = async (request: APIRequestContext, user: IUserState): Promise<JoinableCall[]> => {
	const response = await request.get(`${BASE_API_URL}/video-conference.joinable`, { headers: asUser(user) });
	expect(response.status()).toBe(200);

	const { calls } = (await response.json()) as { calls: JoinableCall[] };
	return calls;
};

/** Takes `user` out of a call on the server, whatever state their call window was left in. */
export const leaveCallAs = async (request: APIRequestContext, user: IUserState, callId: string): Promise<void> => {
	const response = await request.post(`${BASE_API_URL}/video-conference.leave`, { headers: asUser(user), data: { callId } });
	expect(response.status()).toBe(200);
};

export type ConferenceLinkRecord = { _id: string; rid: string; title: string; url: string; ongoingCallId?: string };

/** Creates a conference link in a room as the `api` fixture's user, and answers it as stored. */
export const createConferenceLink = async (api: BaseTest['api'], roomId: string, title: string): Promise<ConferenceLinkRecord> => {
	const response = await api.post('/video-conference.rooms.create', { roomId, title });
	expect(response.status()).toBe(200);

	const { room } = (await response.json()) as { room: ConferenceLinkRecord };
	return room;
};

/** A room's conference links, each with the call running from it, if any. */
export const listConferenceLinks = async (api: BaseTest['api'], roomId: string): Promise<ConferenceLinkRecord[]> => {
	const response = await api.get('/video-conference.rooms.list', { roomId });
	expect(response.status()).toBe(200);

	const { rooms } = (await response.json()) as { rooms: ConferenceLinkRecord[] };
	return rooms;
};

/** The provider the workspace starts conferences with right now, or `undefined` when it has none. */
export const getVideoConferenceProviderName = async (api: BaseTest['api']): Promise<string | undefined> => {
	const response = await api.get('/video-conference.capabilities');
	if (!response.ok()) {
		return undefined;
	}

	const { providerName } = (await response.json()) as { providerName?: string };
	return providerName;
};

/** Starts the conference of the link at `customUrl` as the `api` fixture's user, and answers its call id. */
export const startConferenceFromLink = async (api: BaseTest['api'], roomId: string, customUrl: string): Promise<string> => {
	const response = await api.post('/video-conference.start', { roomId, customUrl });
	expect(response.status()).toBe(200);

	const { data } = (await response.json()) as { data: { callId: string } };
	return data.callId;
};

/** Takes the `api` fixture's user through a conference and out again, so that it ends like any conference left empty. */
export const emptyConference = async (api: BaseTest['api'], callId: string): Promise<void> => {
	expect((await api.post('/video-conference.join', { callId })).status()).toBe(200);
	// Joining answers before the roster has the user, and leaving a call one is not on does nothing.
	await expect
		.poll(async () => {
			const { users = [] } = (await (await api.get('/video-conference.info', { callId })).json()) as { users?: unknown[] };
			return users.length;
		})
		.toBeGreaterThan(0);
	expect((await api.post('/video-conference.leave', { callId })).status()).toBe(200);
};
