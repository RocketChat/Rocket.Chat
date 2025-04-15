import type { AppStatusReport } from '@rocket.chat/core-services';
import { Apps } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/models';
import type { OperationResult } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getInstanceList } from '../../../app/api/server/helpers/getInstanceList';
import { isRunningMs } from '../../../server/lib/isRunningMs';

export async function fetchAppsStatusFromCluster() {
	if (isRunningMs()) {
		return Apps.getAppsStatusInCluster();
	}

	return fetchAppsStatusFromHighAvailability();
}

export async function fetchAppsStatusFromHighAvailability(): Promise<AppStatusReport> {
	// Moleculer connections
	const connections = await getInstanceList();

	if (connections.length < 2) {
		throw new Error('Not enough connections to fetch apps status');
	}

	// Instance status from the database
	const instances = await InstanceStatus.find().toArray();

	const appsStatusPromises: Promise<void>[] = [];
	const statusByApp: AppStatusReport = {};

	connections.forEach((conn) => {
		if (conn.local) {
			return;
		}

		const instance = instances.find((i) => i._id === conn.id);

		if (!instance) {
			throw new Error('Instance not found');
		}

		if (!instance.extraInformation?.port) {
			throw new Error('Instance has no port');
		}

		const [ip] = conn.ipList;
		const url = new URL('api/apps/installed', `http://${ip}`);

		url.port = String(instance.extraInformation.port);

		appsStatusPromises.push(
			fetch(url.toString(), {
				method: 'GET',
				headers: {
					'x-instance-id': conn.id,
				},
			})
				.then((res) => res.json())
				.then((data: OperationResult<'GET', '/apps/installed'> & { success: boolean }) => {
					if (!data.success) {
						throw new Error('Failed to fetch apps status');
					}

					data.apps.forEach((app) => {
						// Status should ALWAYS exist for the 'installed' endpoint, but the type definition
						// doesn't enforce it. So we need to check for it.
						if (!app.status) {
							throw new Error('App status is undefined');
						}

						if (!statusByApp[app.id]) {
							statusByApp[app.id] = [];
						}

						statusByApp[app.id].push({
							instanceId: instance._id,
							status: app.status,
						});
					});
				}),
		);
	});

	await Promise.all(appsStatusPromises);

	return statusByApp;
}
