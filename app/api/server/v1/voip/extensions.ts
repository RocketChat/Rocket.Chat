import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { hasPermission } from '../../../../authorization/server/index';
import { Users } from '../../../../models/server/raw/index';
import { Voip } from '../../../../../server/sdk';
import { IVoipExtensionBase } from '../../../../../definition/IVoipExtension';

// Get the connector version and type
API.v1.addRoute(
	'connector.getVersion',
	{ authRequired: true },
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
	{ authRequired: true },
	{
		async get() {
			const list = await Voip.getExtensionList();
			const result: IVoipExtensionBase[] = list.result as IVoipExtensionBase[];
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
	{ authRequired: true },
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
	{ authRequired: true },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					extension: String,
				}),
			);
			const endpointDetails = await Voip.getRegistrationInfo(this.requestParams());
			return API.v1.success({ ...endpointDetails.result });
		},
	},
);

API.v1.addRoute(
	'connector.extension.getRegistrationInfoByUserId',
	{ authRequired: true },
	{
		async get() {
			check(
				this.requestParams(),
				Match.ObjectIncluding({
					id: String,
				}),
			);
			if (!hasPermission(this.userId, 'view-agent-extension-association')) {
				return API.v1.unauthorized();
			}
			const { id } = this.requestParams();
			const extension = await Users.getVoipExtensionByUserId(id, {
				projection: {
					_id: 1,
					username: 1,
					extension: 1,
				},
			});

			if (!extension.extension) {
				return API.v1.notFound('Extension not found');
			}
			const endpointDetails = await Voip.getRegistrationInfo({ extension: extension.extension });
			return API.v1.success({ ...endpointDetails.result });
		},
	},
);
