
import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';
import { Voip } from '../../../../../server/sdk';
import { ICallServerConfigData, IVoipServerConfig, ServerType } from '../../../../../definition/IVoipServerConfig';
import { IVoipExtensionBase, IVoipExtensionConfig } from '../../../../../definition/IVoipExtension';

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
		const list = Promise.await (
			commandHandler.executeCommand(Commands.extension_list, undefined)) as IVoipExtensionBase;
		this.logger.debug({ msg: 'API = connector.extension.list',
			result: list });
		return API.v1.success({ extensions: list });
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
				this.requestParams())) as IVoipExtensionConfig;
		this.logger.debug({ msg: 'API = connector.extension.getDetails',
			result: endpointDetails });

		return API.v1.success({ ...endpointDetails });
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
			this.requestParams())) as IVoipExtensionConfig;
		const callServerConfig: ICallServerConfigData = config.configData as unknown as ICallServerConfigData;
		const extensionRegistrationInfo = {
			sipRegistrar: config.host,
			websocketUri: callServerConfig.websocketPath,
			extension: endpointDetails.name,
			password: endpointDetails.password,
		};
		this.logger.debug({ msg: 'API = connector.extension.getRegistrationInfo',
			result: endpointDetails });

		return API.v1.success({ ...extensionRegistrationInfo });
	},
});
