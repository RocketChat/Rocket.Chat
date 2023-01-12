import type { ISubscription } from "@rocket.chat/core-typings";
import { api, credentials, request } from "./api-data";

export const getSubscriptionForRoom = async (roomId: string, overrideCredential?: { 'X-Auth-Token': string; 'X-User-Id': string; }): Promise<ISubscription> => {
	const response = await request
		.get(api('subscriptions.getOne'))
		.set(overrideCredential || credentials)
		.query({ roomId })
		.expect('Content-Type', 'application/json')
		.expect(200);

	const { subscription } = response.body;

	return subscription;
}
