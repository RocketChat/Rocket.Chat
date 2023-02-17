import { HTTP } from 'meteor/http';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { AppRequest, IUser, Pagination } from '@rocket.chat/core-typings';

import { API } from '../../../api/server';
import { getWorkspaceAccessToken } from '../../../cloud/server';
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
		const msg = `${TAPi18n.__('App_request_enduser_message', { appname: appName, learnmore: learnMoreUrl, lng: defaultLang })}`;

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
		const data = HTTP.get(
			`${marketplaceBaseUrl}/v1/app-request?appId=${appId}&q=notification-not-sent&limit=${pagination.limit}&offset=${pagination.offset}`,
			{ headers },
		);

		const appRequests = API.v1.success({ data });
		const { total } = appRequests.body.data.data.meta;

		if (total === undefined || total === 0) {
			return [];
		}

		// Calculate the number of loops - 1 because the first request was already made
		const loops = Math.ceil(total / pagination.limit) - 1;
		const requestsCollection = [];
		const learnMore = `${workspaceUrl}admin/marketplace/all/info/${appId}`;

		// Notify first batch
		requestsCollection.push(
			Promise.resolve(appRequests.body.data.data.data)
				.then((response) => notifyBatchOfUsers(appName, learnMore, response))
				.catch(notifyBatchOfUsersError),
		);

		// Batch requests
		for (let i = 0; i < loops; i++) {
			pagination.offset += pagination.limit;

			const request = HTTP.get(
				`${marketplaceBaseUrl}/v1/app-request?appId=${appId}&q=notification-not-sent&limit=${pagination.limit}&offset=${pagination.offset}`,
				{ headers },
			);

			requestsCollection.push(notifyBatchOfUsers(appName, learnMore, request.data.data));
		}

		const finalResult = await Promise.all(requestsCollection);

		// Return the list of users that were notified
		return finalResult.flat();
	} catch (e) {
		throw e;
	}
};
