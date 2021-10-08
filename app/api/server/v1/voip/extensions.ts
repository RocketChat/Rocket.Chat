
import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';
import { Voip } from '../../../../../server/sdk';
import { ICallServerConfigData, IVoipServerConfig, ServerType } from '../../../../../definition/IVoipServerConfig';
import { IVoipExtensionConfig } from '../../../../../definition/IVoipExtension';
import { IVoipConnectorResult } from '../../../../../definition/IVoipConnectorResult';

const commandHandler = new CommandHandler();
// Get the connector version and type
API.v1.addRoute('connector.getversion', { authRequired: true }, {
	get() {
		return API.v1.success(commandHandler.getVersion());
	},
});

// Get the extensions available on the call server
API.v1.addRoute('connector.extension.list', { authRequired: true }, {
	get() {
		const list = Promise.await(
			commandHandler.executeCommand(Commands.extension_list, undefined),
		) as IVoipConnectorResult;
		this.logger.debug({ msg: 'API = connector.extension.list', result: list.result });
		return API.v1.success({ extensions: list.result });
	},
});

/* Get the details of a single extension.
 * Note : This API will either be called by  the endpoint
 * or will be consumed internally.
 */
API.v1.addRoute('connector.extension.getDetails', { authRequired: true }, {
	get() {
		const endpointDetails = Promise.await (
			commandHandler.executeCommand(
				Commands.extension_info,
				this.requestParams()),
		) as IVoipConnectorResult;
		this.logger.debug({ msg: 'API = connector.extension.getDetails', result: endpointDetails.result });

		return API.v1.success({ ...endpointDetails.result });
	},
});

/* Get the details for registration extension.
 */
API.v1.addRoute('connector.extension.getRegistrationInfo', { authRequired: true }, {
	get() {
		const config: IVoipServerConfig = Promise.await(
			Voip.getServerConfigData(ServerType.CALL_SERVER)) as unknown as IVoipServerConfig;
		if (!config) {
			this.logger.warn({ msg: 'API = connector.extension.getRegistrationInfo callserver settings not found' });
			return API.v1.notFound();
		}
		const endpointDetails = Promise.await (commandHandler.executeCommand(
			Commands.extension_info,
			this.requestParams())) as IVoipConnectorResult;
		const callServerConfig: ICallServerConfigData = config.configData as unknown as ICallServerConfigData;
		const endpointInfo: IVoipExtensionConfig = endpointDetails.result as IVoipExtensionConfig;
		const extensionRegistrationInfo = {
			sipRegistrar: config.host,
			websocketUri: callServerConfig.websocketPath,
			extension: endpointInfo.name,
			password: endpointInfo.password,
		};
		this.logger.debug({ msg: 'API = connector.extension.getRegistrationInfo', result: endpointDetails });

		return API.v1.success({ ...extensionRegistrationInfo });
	},
});
