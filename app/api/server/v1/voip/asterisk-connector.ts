
import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';
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
		this.logger.debug(`API = connector.extension.list JSON=${ JSON.stringify(list) }`);
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
		return API.v1.success({ ...endpointDetails });
	},
});

/* Get the details for registration extension.
 */
API.v1.addRoute('connector.extension.getRegistrationInfo', { authRequired: true }, {
	get() {
		/**
		 * REMOVE_THIS
		 * Note : Once Murtaza's code reviews are done,
		 * this hardcoding will be removed.
		 *
		 */
		const serverConfig = {
			sipRegistrar: 'omni-asterisk.dev.rocket.chat',
			websocketUri: 'wss://omni-asterisk.dev.rocket.chat/ws',
		};
		/**
		 * REMOVE_THIS
		 */
		const endpointDetails = Promise.await (commandHandler.executeCommand(
			Commands.extension_info,
			this.requestParams())) as IVoipExtensionConfig;

		const extensionRegistrationInfo = {
			sipRegistrar: serverConfig.sipRegistrar,
			websocketUri: serverConfig.websocketUri,
			extension: endpointDetails.name,
			password: endpointDetails.password,
		};
		return API.v1.success({ ...extensionRegistrationInfo });
	},
});
