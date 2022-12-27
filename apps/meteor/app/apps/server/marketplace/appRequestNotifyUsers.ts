import { HTTP } from 'meteor/http';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { AppRequest, IUser, Pagination } from '@rocket.chat/core-typings';

import { API } from '../../../api/server';
import { getWorkspaceAccessToken } from '../../../cloud/server';
import { Info } from '../../../utils';
import { sendMessagesToUsers } from '../../../../server/lib/sendMessagesToUsers';

const appsEngineVersionForMarketplace = Info.marketplaceApiVersion.replace(/-.*/g, '');
const getDefaultHeaders = () => ({
	'X-Apps-Engine-Version': appsEngineVersionForMarketplace,
	'Authorization': '',
});

const notifyBatchOfUsersError = (error: unknown) => {
	throw error;
};

const notifyBatchOfUsers = async (marketplaceBaseUrl: string, appId: string, appName: string, appRequests: AppRequest[]) => {
	const batchRequesters = appRequests.reduce((acc: string[], appRequest: AppRequest) => {
		// Prevent duplicate requesters
		if (!acc.includes(appRequest.requester.id)) {
			acc.push(appRequest.requester.id);
		}

		return acc;
	}, []);

	const headers = getDefaultHeaders();
	const token = await getWorkspaceAccessToken();

	const msgFn = (user: IUser): string => {
		const defaultLang = user.language || 'en';
		const msg = `${TAPi18n.__('App_request_enduser_message', { appname: appName, lng: defaultLang })}`;

		return msg;
	};

	try {
		const success = await sendMessagesToUsers('rocket.cat', batchRequesters, msgFn);

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		// Mark all success messages for users as sent
		await HTTP.post(`${marketplaceBaseUrl}/v1/app-request/markAsSent`, {
			data: {
				appId,
				userIds: success,
			},
			headers,
		});
	} catch (e) {
		throw e;
	}
};

export const appRequestNotififyForUsers = async (marketplaceBaseUrl: string, appId: string, appName: string) => {
	try {
		const headers = getDefaultHeaders();
		const token = await getWorkspaceAccessToken();

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		// First request
		const pagination: Pagination = { limit: 5, offset: 0 };

		// First request to get the total and the first batch
		const data = HTTP.get(
			`${marketplaceBaseUrl}/v1/app-request?appId=${appId}&q=notification-not-sent&limit=${pagination.limit}&offset=${pagination.offset}`,
			{
				headers,
			},
		);

		const appRequests = API.v1.success({ data });
		const { total } = appRequests.body.data.data.meta;

		if (total === 0) {
			return;
		}

		// Calculate the number of loops - 1 because the first request was already made
		const loops = Math.ceil(total / pagination.limit) - 1;
		const requestsCollection = [];

		// Notify first batch
		requestsCollection.push(
			Promise.resolve(appRequests.body.data.data.data)
				.then((response) => notifyBatchOfUsers(marketplaceBaseUrl, appId, appName, response))
				.catch(notifyBatchOfUsersError),
		);

		// Batch requests
		for (let i = 0; i < loops; i++) {
			pagination.offset += pagination.limit;

			const request = HTTP.get(
				`${marketplaceBaseUrl}/v1/app-request?appId=${appId}&q=notification-not-sent&limit=${pagination.limit}&offset=${pagination.offset}`,
				{
					headers,
				},
			);

			requestsCollection.push(notifyBatchOfUsers(marketplaceBaseUrl, appId, appName, request.data.data));
		}

		await Promise.all(requestsCollection);
	} catch (e) {
		throw e;
	}
};
