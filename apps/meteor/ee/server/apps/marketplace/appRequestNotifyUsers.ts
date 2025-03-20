import type { AppRequest, IUser, Pagination } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { i18n } from '../../../../server/lib/i18n';
import { sendDirectMessageToUsers } from '../../../../server/lib/sendDirectMessageToUsers';

const ROCKET_CAT_USERID = 'rocket.cat';
const DEFAULT_LIMIT = 100;

const notifyBatchOfUsersError = (error: Error) => {
	return new Error(`could not notify the batch of users. Error ${error}`);
};

const notifyBatchOfUsers = async (appName: string, learnMoreUrl: string, appRequests: AppRequest[]): Promise<string[]> => {
	const batchRequesters = appRequests.reduce((acc: string[], appRequest: AppRequest) => {
		// Prevent duplicate requesters
		if (!acc.includes(appRequest.requester.id)) {
			acc.push(appRequest.requester.id);
		}

		return acc;
	}, []);

	const msgFn = (user: IUser): string => {
		const defaultLang = user.language || 'en';
		const msg = `${i18n.t('App_request_enduser_message', { appName, learnmore: learnMoreUrl, lng: defaultLang })}`;

		return msg;
	};

	try {
		return await sendDirectMessageToUsers(ROCKET_CAT_USERID, batchRequesters, msgFn);
	} catch (e) {
		throw e;
	}
};

export const appRequestNotififyForUsers = async (
	marketplaceBaseUrl: string,
	workspaceUrl: string,
	appId: string,
	appName: string,
): Promise<(string | Error)[]> => {
	try {
		const token = await getWorkspaceAccessToken();
		const headers = {
			Authorization: `Bearer ${token}`,
		};

		// First request
		const pagination: Pagination = { limit: DEFAULT_LIMIT, offset: 0 };

		// First request to get the total and the first batch
		const response = await fetch(`${marketplaceBaseUrl}/v1/app-request`, {
			headers,
			params: {
				appId,
				q: 'notification-not-sent',
				limit: pagination.limit,
				offset: pagination.offset,
			},
		});

		const data = (await response.json()) as { meta: { total: number }; data: any };

		const { total } = data.meta;

		if (total === undefined || total === 0) {
			return [];
		}

		// Calculate the number of loops - 1 because the first request was already made
		const loops = Math.ceil(total / pagination.limit) - 1;
		const requestsCollection = [];
		const learnMore = `${workspaceUrl}marketplace/explore/info/${appId}`;

		// Notify first batch
		requestsCollection.push(notifyBatchOfUsers(appName, learnMore, data.data).catch(notifyBatchOfUsersError));

		// Batch requests
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for await (const _i of Array.from({ length: loops })) {
			pagination.offset += pagination.limit;

			const request = await fetch(
				`${marketplaceBaseUrl}/v1/app-request?appId=${appId}&q=notification-not-sent&limit=${pagination.limit}&offset=${pagination.offset}`,
				{ headers },
			);

			const { data } = await request.json();

			requestsCollection.push(notifyBatchOfUsers(appName, learnMore, data));
		}

		const finalResult = await Promise.all(requestsCollection);

		// Return the list of users that were notified
		return finalResult.flat();
	} catch (e) {
		throw e;
	}
};
