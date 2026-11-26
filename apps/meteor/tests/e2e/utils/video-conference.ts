import type { APIRequestContext } from '@playwright/test';

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
