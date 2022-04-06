import { Match, check } from 'meteor/check';
import type { IVoipExtensionBase } from '@rocket.chat/core-typings';

import { API } from '../../api';
import { Users } from '../../../../models/server/raw/index';
import { Voip } from '../../../../../server/sdk';
import { generateJWT } from '../../../../utils/server/lib/JWTHelper';
import { settings } from '../../../../settings/server';
import { logger } from './logger';

// Get the connector version and type
API.v1.addRoute(
	'connector.getVersion',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			const version = await Voip.getConnectorVersion();
			return API.v1.success(version);
		},
	},
);

// Get the extensions available on the call server
API.v1.addRoute(
	'connector.extension.list',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			const list = await Voip.getExtensionList();
			const result = list.result as IVoipExtensionBase[];
			return API.v1.success({ extensions: result });
		},
	},
);

/* Get the details of a single extension.
 * Note : This API will either be called by  the endpoint
 * or will be consumed internally.
 */
API.v1.addRoute(
	'connector.extension.getDetails',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const endpointDetails = await Voip.getExtensionDetails(this.requestParams());
			return API.v1.success({ ...endpointDetails.result });
		},
	},
);

/* Get the details for registration extension.
 */

API.v1.addRoute(
	'connector.extension.getRegistrationInfoByExtension',
	{ authRequired: true, permissionsRequired: ['manage-voip-call-settings'] },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const endpointDetails = await Voip.getRegistrationInfo(this.requestParams());
			const encKey = settings.get('VoIP_JWT_Secret');
			if (!encKey) {
				logger.warn('No JWT keys set. Sending registration info as plain text');
				return API.v1.success({ ...endpointDetails.result });
			}

			const result = generateJWT(endpointDetails.result, encKey);
			return API.v1.success({ result });
		},
	},
);

API.v1.addRoute(
	'connector.extension.getRegistrationInfoByUserId',
	{ authRequired: true, permissionsRequired: ['view-agent-extension-association'] },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					id: String,
				}),
			);
			const { id } = this.requestParams();

			if (id !== this.userId) {
				return API.v1.unauthorized();
			}

			const { extension } =
				(await Users.getVoipExtensionByUserId(id, {
					projection: {
						_id: 1,
						username: 1,
						extension: 1,
					},
				})) || {};

			if (!extension) {
				return API.v1.notFound('Extension not found');
			}

			const endpointDetails = await Voip.getRegistrationInfo({ extension });
			const encKey = settings.get('VoIP_JWT_Secret');
			if (!encKey) {
				logger.warn('No JWT keys set. Sending registration info as plain text');
				return API.v1.success({ ...endpointDetails.result });
			}

			const result = generateJWT(endpointDetails.result, encKey);
			return API.v1.success({ result });
		},
	},
);
