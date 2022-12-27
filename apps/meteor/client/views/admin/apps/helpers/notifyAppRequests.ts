import type { App, AppRequest, Pagination, RestResponse } from '@rocket.chat/core-typings';

import { Apps } from '../../../../../app/apps/client/orchestrator';

const notifyBatchOfUsersError = (error: unknown) => {
	console.log('error', error);
};

const notifyBatchOfUsers = async (app: App, appRequests: RestResponse) => {
	const batchRequesters = appRequests.data.reduce((acc: string[], appRequest: AppRequest) => {
		// Prevent duplicate requesters
		if (!acc.includes(appRequest.requester.id)) {
			acc.push(appRequest.requester.id);
		}

		return acc;
	}, []);

	// Notify users via rocket.cat
	Apps.notifyUsers(batchRequesters, app);
};

export const appRequestNotificationForUsers = async (app: App): Promise<void> => {
	try {
		// First request
		const pagination: Pagination = { limit: 50, offset: 0 };

		// First request to get the total and the first batch
		const appRequests = await Apps.appRequests(app.id, 'notification-not-sent', '-createdDate', pagination);
		const { total } = appRequests.meta;

		if (total === 0) {
			return;
		}

		// Calculate the number of loops - 1 because the first request was already made
		const loops = Math.ceil(total / pagination.limit) - 1;
		const requestsCollection = [];

		// Notify first batch
		requestsCollection.push(
			Promise.resolve(appRequests)
				.then((response) => notifyBatchOfUsers(app, response))
				.catch(notifyBatchOfUsersError),
		);

		// Batch requests
		for (let i = 0; i < loops; i++) {
			pagination.offset += pagination.limit;

			const request = Apps.appRequests(app.id, 'notification-not-sent', '-createdDate', pagination);

			request.then((response) => notifyBatchOfUsers(app, response)).catch(notifyBatchOfUsersError);
			requestsCollection.push(request);
		}

		await Promise.all(requestsCollection);
	} catch (e) {
		throw e;
	}
};
