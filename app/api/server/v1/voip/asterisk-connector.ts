
import { API } from '../../api';
import { Commands } from '../../../../../server/services/voip/connector/asterisk/Commands';
import { CommandHandler } from '../../../../../server/services/voip/connector/asterisk/CommandHandler';

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
		try {
			const list = Promise.await (commandHandler.executeCommand(Commands.extension_list, undefined));
			return API.v1.success({ ...list });
		} catch (error) {
			return API.v1.failure({
				error,
			});
		}
	},
});

/* Get the details of a single extension.
 * Note : This API will either be called by  the endpoint
 * or will be consumed internally.
 */
API.v1.addRoute('connector.extension.getDetails', { authRequired: true }, {
	get() {
		try {
			const endpointdetails = Promise.await (commandHandler.executeCommand(
				Commands.extension_info,
				this.requestParams()));
			return API.v1.success({ ...endpointdetails });
		} catch (error) {
			return API.v1.failure({
				error,
			});
		}
	},
});
