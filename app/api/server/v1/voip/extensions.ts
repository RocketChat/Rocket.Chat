
import { Match, check } from 'meteor/check';

import { API } from '../../api';
import { Voip } from '../../../../../server/sdk';
import { IVoipExtensionBase } from '../../../../../definition/IVoipExtension';
import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';

// Get the connector version and type
API.v1.addRoute('connector.getVersion', { authRequired: true }, {
	get() {
		const version = Promise.await(Voip.getConnectorVersion());
		return API.v1.success(version);
	},
});

// Get the extensions available on the call server
API.v1.addRoute('connector.extension.list', { authRequired: true }, {
	get() {
		const list = Promise.await(Voip.getExtensionList()) as IVoipConnectorResult;
		const result: IVoipExtensionBase[] = list.result as IVoipExtensionBase[];
		this.logger.debug({ msg: 'API = connector.extension.list length ', result: result.length });
		return API.v1.success({ extensions: result });
	},
});

/* Get the details of a single extension.
 * Note : This API will either be called by  the endpoint
 * or will be consumed internally.
 */
API.v1.addRoute('connector.extension.getDetails', { authRequired: true }, {
	get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const endpointDetails = Promise.await(Voip.getExtensionDetails(this.requestParams())) as IVoipConnectorResult;
		this.logger.debug({ msg: 'API = connector.extension.getDetails', result: endpointDetails.result });
		return API.v1.success({ ...endpointDetails.result });
	},
});

/* Get the details for registration extension.
 */
API.v1.addRoute('connector.extension.getRegistrationInfo', { authRequired: true }, {
	get() {
		check(this.requestParams(), Match.ObjectIncluding({
			extension: String,
		}));
		const endpointDetails = Promise.await(Voip.getRegistrationInfo(this.requestParams()));
		this.logger.debug({ msg: 'API = connector.extension.getRegistrationInfo', result: endpointDetails });
		return API.v1.success({ ...endpointDetails.result });
	},
});
