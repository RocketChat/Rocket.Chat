
import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import { IVoipExtensionBase } from '../../../../../definition/IVoipExtension';

// Get the connector version and type
API.v1.addRoute('connector.getVersion', { authRequired: true }, {
	async get() {
		const version = await Voip.getConnectorVersion();
		return API.v1.success(version);
	},
});

// Get the extensions available on the call server
API.v1.addRoute('connector.extension.list', { authRequired: true }, {
	async get() {
		const list = await Voip.getExtensionList();
		const result: IVoipExtensionBase[] = list.result as IVoipExtensionBase[];
		return API.v1.success({ extensions: result });
	},
});

/* Get the details of a single extension.
 * Note : This API will either be called by  the endpoint
 * or will be consumed internally.
 */
API.v1.addRoute('connector.extension.getDetails', { authRequired: true }, {
	async get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const endpointDetails = await Voip.getExtensionDetails(this.requestParams());
		return API.v1.success({ ...endpointDetails.result });
	},
});

/* Get the details for registration extension.
 */

API.v1.addRoute('connector.extension.getRegistrationInfo', { authRequired: true }, {
	async get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const endpointDetails = await Voip.getRegistrationInfo(this.requestParams());
		return API.v1.success({ ...endpointDetails.result });
	},
});
