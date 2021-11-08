/**
 * This class is responsible for handling PJSIP endpoints.
 * @remarks
 * Some design notes :
 * 1. CommandFactory creates the child classes of the |Command| class and
 * 	  returns a reference to |Command|
 * 2. |CommandHandler| class call executeCommand method of |Command| class, which
 *    gets overriden here.
 * 3. Consumers of this class create the instance based on |Commands| object but
 *    specific command object 'knows' about asterisk-ami command. Reason for doing this is
 *    that the consumer does not and should not know about the pbx specific commands
 * 	  used for fetching the information. e.g for endpoint list and endpoint info,
 * 	  it uses pjsipshowendpoints and pjsipshowendpoint.
 * 4. Asterisk responds asynchronously and it responds using events. Command specific
 *    event handling is implemented by this class.
 * 5. Every execution of command takes action-callback, which tells whether the command can be
 *    executed or there is an error. In case of success, it ends set of events
 *    the completion of which is indicated by <action>completed event. e.g while fetching the endpoint,
 *    i.e for executing |pjsipshowendpoint|  asterisk sends the different parts of i
 *    nformation in different events. event |endpointdetail| indicates
 *    endpoint name, devicestate etc. |authdetail| indicates type of authentication, password and other
 *    auth related information. At the end of the series of these events, Asterisk sends |endpointdetailcomplete|
 * 	  event. At this point of time, promise, on which the consumer is waiting can be resolved.
 * 6. This class could use asynchronous callbacks. But because the connector will be used extensively by REST layer
 *    we have taken promise based approach. Promise is returned as a part of executeCommand. Caller would wait for
 *    the completion/rejection. This class will reject the promise based on error or resolve it in <command>complete
 *    event.
 * 7. Important to note that the intermediate events containing a result part for an execution of a particular command
 *    have same actionid, which is received by this class as a successful execution of a command in actionResultCallback.
 */
import { Command, CommandType } from '../Command';
import { Logger } from '../../../../../lib/logger/Logger';
import { Commands } from '../Commands';
import { CallbackContext } from './CallbackContext';
import { EndpointState, IExtensionDetails } from '../../../../../../definition/IVoipExtension';
import { IVoipConnectorResult } from '../../../../../../definition/IVoipConnectorResult';

export class PJSIPEndpoint extends Command {
	private logger: Logger;

	constructor(command: string, parametersNeeded: boolean) {
		super(command, parametersNeeded);
		this.logger = new Logger('PJSIPEndpoint');
		this._type = CommandType.AMI;
	}

	private getState(endpointState: string): EndpointState {
		let state: EndpointState = EndpointState.UNKNOWN;
		if (endpointState.toLowerCase() === 'unavailable') {
			state = EndpointState.UNREGISTERED;
		} else if (endpointState.toLowerCase() === 'available') {
			state = EndpointState.REGISTERED;
		}
		return state;
	}

	/**
	 * Event handler for endpointlist event containing the information of the endpoints.
	 * @remark
	 * This event is generated as a result of the execution of |pjsipshowendpoints|
	 */
	onEndpointList(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({ msg: 'onEndpointList() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		const endPoint: IExtensionDetails = {
			extension: event.objectname,
			state: this.getState(event.devicestate),
			password: '',
			authtype: '',
		};
		const { result } = this;
		if (result.endpoints) {
			result.endpoints.push(endPoint);
		} else {
			// create an array of endpoints in the result for
			// the first time.
			result.endpoints = [];
			result.endpoints.push(endPoint);
		}
		this.logger.debug({ msg: `onEndpointList Data = ${ JSON.stringify(endPoint) }` });
	}

	/**
	 * Event handler for endpointlistcomplete event indicating that all the data
	 * is received.
	 */
	onEndpointListComplete(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({ msg: 'onEndpointListComplete() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		this.resetEventHandlers();
		const { result } = this;
		this.logger.debug({ msg: `onEndpointListComplete() Complete. Data = ${ JSON.stringify(result) }` });
		this.returnResolve({ result: result.endpoints } as IVoipConnectorResult);
	}

	/**
	 * Event handler for endpointdetail and authdetail event containing the endpoint specific details
	 * and authentication information.
	 * @remark
	 * This event is generated as a result of the execution of |pjsipshowendpoint|.
	 * We consolidate this endpointdetail and authdetail events because they are generated
	 * as a result of same command. Nevertheless, in future, if such implementation
	 * becomes difficult, it is recommended that there should be a separate handling
	 * for each event.
	 */
	onEndpointInfo(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({ msg: 'onEndpointInfo() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		const { result } = this;

		if (!result.endpoint) {
			const endpointDetails: IExtensionDetails = {
				extension: '',
				state: '',
				password: '',
				authtype: '',
			};
			result.endpoint = endpointDetails;
		}
		if (event.event.toLowerCase() === 'endpointdetail') {
			(result.endpoint as IExtensionDetails).extension = event.objectname;
			(result.endpoint as IExtensionDetails).state = this.getState(event.devicestate);
		} else if (event.event.toLowerCase() === 'authdetail') {
			(result.endpoint as IExtensionDetails).password = event.password;
			(result.endpoint as IExtensionDetails).authtype = event.authtype;
		}

		this.logger.debug({ msg: `onEndpointList Data = ${ JSON.stringify(result.endpoint) }` });
	}

	/**
	 * Event handler for endpointdetailcomplete event indicating that all the data
	 * is received.
	 */
	onEndpointDetailComplete(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({ msg: 'onEndpointDetailComplete() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		this.resetEventHandlers();
		const { result } = this;
		this.logger.debug({ msg: 'onEndpointDetailComplete() Complete', result });

		this.returnResolve({ result: result.endpoint } as IVoipConnectorResult);
	}

	/**
	 * Callback for indicatiing command execution status.
	 * Received actionid for the first time.
	 */
	onActionResult(error: any, result: any): void {
		if (error) {
			this.logger.error({ msg: 'onActionResult()', error: JSON.stringify(error) });
			this.returnReject(`error${ error } while executing command`);
		} else {
			this.logger.debug({ msg: 'onActionResult()', result });
			// Set up actionid for future reference in case of success.
			this.actionid = result.actionid;
		}
	}

	setupEventHandlers(): void {
		// Setup necessary command event handlers based on the command
		switch (this.commandText) {
			case Commands.extension_list.toString(): {
				this.connection.on('endpointlist', new CallbackContext(this.onEndpointList.bind(this), this));
				this.connection.on('endpointlistcomplete', new CallbackContext(this.onEndpointListComplete.bind(this), this));
				break;
			}
			case Commands.extension_info.toString(): {
				this.connection.on('endpointdetail', new CallbackContext(this.onEndpointInfo.bind(this), this));
				this.connection.on('authdetail', new CallbackContext(this.onEndpointInfo.bind(this), this));
				this.connection.on('endpointdetailcomplete', new CallbackContext(this.onEndpointDetailComplete.bind(this), this));
				break;
			}
			default: {
				this.logger.error({ msg: `setupEventHandlers() : Unimplemented ${ this.commandText }` });
				break;
			}
		}
	}

	resetEventHandlers(): void {
		switch (this.commandText) {
			case Commands.extension_list.toString(): {
				this.connection.off('endpointlist', this);
				this.connection.off('endpointlistcomplete', this);
				break;
			}
			case Commands.extension_info.toString(): {
				this.connection.off('endpointdetail', this);
				this.connection.off('authdetail', this);
				this.connection.off('endpointdetailcomplete', this);
				break;
			}
			default: {
				this.logger.error({ msg: `resetEventHandlers() : Unimplemented ${ this.commandText }` });
				break;
			}
		}
	}

	async executeCommand(data: any): Promise <IVoipConnectorResult> {
		let action = 'none';
		this.logger.info({ msg: `executeCommand() executing ${ this.commandText }` });
		let amiCommand = {};
		// set up the specific action based on the value of |Commands|
		if (this.commandText === Commands.extension_list.toString()) {
			amiCommand = {
				action: 'pjsipshowendpoints',
			};
		} else if (this.commandText === Commands.extension_info.toString()) {
			action = 'pjsipshowendpoint';
			// |pjsipshowendpoint| needs input parameter |endpoint| indicating
			// which endpoint information is to be queried.
			amiCommand = {
				action,
				endpoint: data.extension,
			};
		}
		this.logger.debug({ msg: `executeCommand() executing AMI command ${ JSON.stringify(amiCommand) }`, data });
		const actionResultCallback = this.onActionResult.bind(this);
		const eventHandlerSetupCallback = this.setupEventHandlers.bind(this);
		return super.prepareCommandAndExecution(amiCommand, actionResultCallback, eventHandlerSetupCallback);
	}
}
