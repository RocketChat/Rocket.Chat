import { InstanceStatus } from '@rocket.chat/models';
import { ajv, validateUnauthorizedErrorResponse, validateForbiddenErrorResponse } from '@rocket.chat/rest-typings';

import { isRunningMs } from '../../../../server/lib/isRunningMs';
import { API } from '../api';
import { getInstanceList } from '../helpers/getInstanceList';

const getConnections = (() => {
	if (isRunningMs()) {
		return () => [];
	}

	return () => getInstanceList();
})();

API.v1.get(
	'instances.get',
	{
		authRequired: true,
		permissionsRequired: ['view-statistics'],
		response: {
			200: ajv.compile<{
				instances: {
					address?: string;
					currentStatus: {
						connected: boolean;
						lastHeartbeatTime?: number;
						local?: boolean;
					};
					instanceRecord: object;
					broadcastAuth: boolean;
				}[];
				success: true;
			}>({
				type: 'object',
				properties: {
					instances: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								address: { type: 'string' },
								currentStatus: {
									type: 'object',
									properties: {
										connected: { type: 'boolean' },
										lastHeartbeatTime: { type: 'number' },
										local: { type: 'boolean' },
									},
									required: ['connected'],
								},
								instanceRecord: { type: 'object' },
								broadcastAuth: { type: 'boolean' },
							},
							required: ['currentStatus', 'instanceRecord', 'broadcastAuth'],
						},
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['instances', 'success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const instanceRecords = await InstanceStatus.find().toArray();

		const connections = await getConnections();

		const result = instanceRecords.map((instanceRecord) => {
			const connection = connections.find((c) => c.id === instanceRecord._id);

			return {
				address: connection?.ipList[0],
				currentStatus: {
					connected: connection?.available || false,
					lastHeartbeatTime: connection?.lastHeartbeatTime,
					local: connection?.local,
				},
				instanceRecord,
				broadcastAuth: true,
			};
		});

		return API.v1.success({
			instances: result,
		});
	},
);
