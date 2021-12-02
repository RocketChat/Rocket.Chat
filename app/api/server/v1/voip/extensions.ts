
import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import { IRegistrationInfo, IVoipExtensionBase, IVoipExtensionConfig } from '../../../../../definition/IVoipExtension';
// import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';

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
		const { result } = await Voip.getExtensionList();
		const extensions = result as IVoipExtensionBase[];
		// this.logger.debug({ msg: 'API = connector.extension.list length ', result: result.length });
		return API.v1.success({ extensions });
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
		const { result } = await Voip.getExtensionDetails(this.requestParams());
		// this.logger.debug({ msg: 'API = connector.extension.getDetails', result: endpointDetails.result });
		return API.v1.success({ ...(result as IVoipExtensionConfig) });
	},
});

/* Get the details for registration extension.
 */
API.v1.addRoute('connector.extension.getRegistrationInfo', { authRequired: true }, {
	async get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		console.log('API = connector.extension.getRegistrationDetails', this.requestParams());
		const { result } = await Voip.getRegistrationInfo(this.requestParams());

		return API.v1.success({ ...(result as IRegistrationInfo) });
	},
});
