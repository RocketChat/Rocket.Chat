import { License } from '@rocket.chat/license';
import { ajv } from '@rocket.chat/rest-typings';

import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const workspaceEndpoints = API.v1.get(
	'workspaces.info',
	{
		authRequired: true,
		response: {
			200: ajv.compile<{
				license: {
					isEnterprise: boolean;
				};
				workspace: {
					isRegistered: boolean;
				};
			}>({
				type: 'object',
				properties: {
					license: {
						type: 'object',
						properties: {
							isEnterprise: {
								type: 'boolean',
							},
						},
						required: ['isEnterprise'],
						additionalProperties: false,
					},
					workspace: {
						type: 'object',
						properties: {
							isRegistered: {
								type: 'boolean',
							},
						},
						required: ['isRegistered'],
						additionalProperties: false,
					},
					success: {
						type: 'boolean',
						enum: [true],
					},
				},
				required: ['license', 'workspace', 'success'],
				additionalProperties: false,
			}),
		},
	},
	async () => {
		const isEnterprise = License.hasValidLicense();
		const { workspaceRegistered } = await retrieveRegistrationStatus();

		return API.v1.success({
			license: {
				isEnterprise,
			},
			workspace: {
				isRegistered: workspaceRegistered,
			},
		});
	},
);

type WorkspaceEndpoints = ExtractRoutesFromAPI<typeof workspaceEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends WorkspaceEndpoints {}
}
