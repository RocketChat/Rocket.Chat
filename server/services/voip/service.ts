import { Db } from 'mongodb';

import { IVoipService } from '../../sdk/types/IVoipService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { Logger } from '../../lib/logger/Logger';
import { VoipServerConfigurationRaw } from '../../../app/models/server/raw/VoipServerConfiguration';
import { ServerType, IVoipServerConfig, ICallServerConfigData } from '../../../definition/IVoipServerConfig';
import { CommandHandler } from './connector/asterisk/CommandHandler';
import { CommandType } from './connector/asterisk/Command';
import { Commands } from './connector/asterisk/Commands';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IExtensionDetails, IQueueMembershipDetails, IRegistrationInfo } from '../../../definition/IVoipExtension';
import { IQueueDetails, IQueueSummary } from '../../../definition/ACDQueues';
import { IUser } from '../../../definition/IUser';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { IRoom } from '../../../definition/IRoom';

export class VoipService extends ServiceClass implements IVoipService {
	protected name = 'voip';

	private logger: Logger;

	// this will hold the multiple call server connection settings that can be supported
	// They should only be modified through this service
	private VoipServerConfiguration: VoipServerConfigurationRaw;

	commandHandler: CommandHandler;

	constructor(db: Db) {
		super();

		this.logger = new Logger('voip service');
		this.VoipServerConfiguration = new VoipServerConfigurationRaw(db.collection('rocketchat_voip_server_configuration'));

		this.commandHandler = new CommandHandler(this);
		try {
			Promise.await(this.commandHandler.initConnection(CommandType.AMI));
		} catch (error) {
			this.logger.error({ mst: `Error while initialising the connector. error = ${ error }` });
		}
	}

	private async initManagementServerConnection(): Promise<void> {
		this.logger.info({ msg: 'initialiseManagementServer() initialising the connector' });
		await this.commandHandler.initConnection(CommandType.AMI);
	}

	async addServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		Promise.await(this.deactivateServerConfigDataIfAvailable(type));

		const existingConfig = await this.getServerConfigData(type);
		if (existingConfig) {
			throw new Error(`Error! There already exists an active record of type ${ type }`);
		}

		const returnValue = !!await this.VoipServerConfiguration.insertOne(config);
		if (returnValue && type === ServerType.MANAGEMENT) {
			// If we have added management server, initialise the connection to it.
			Promise.await(this.initManagementServerConnection());
		}
		return returnValue;
	}

	async updateServerConfigData(config: Omit<IVoipServerConfig, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		Promise.await(this.deactivateServerConfigDataIfAvailable(type));

		const existingConfig = await this.getServerConfigData(type);
		if (!existingConfig) {
			throw new Error(`Error! No active record exists of type ${ type }`);
		}

		await this.VoipServerConfiguration.updateOne({ type, active: true }, config);

		return true;
	}

	// in-future, if we want to keep a track of duration during which a server config was active, then we'd need to modify the
	// IVoipServerConfig interface and add columns like "valid_from_ts" and "valid_to_ts"
	async deactivateServerConfigDataIfAvailable(type: ServerType): Promise<boolean> {
		await this.VoipServerConfiguration.updateMany({ type, active: true }, { $set: { active: false } });
		return true;
	}

	async getServerConfigData(type: ServerType): Promise<IVoipServerConfig | null> {
		return this.VoipServerConfiguration.findOne({ type, active: true });
	}

	// this is a dummy function to avoid having an empty IVoipService interface
	getConfiguration(): any {
		return {};
	}

	getConnector(): Promise<CommandHandler> {
		return Promise.resolve(this.commandHandler);
	}

	async getQueueSummary(): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(Commands.queue_summary);
	}

	async getQueuedCallsForThisExtension(requestParams: any): Promise<IVoipConnectorResult> {
		const membershipDetails: IQueueMembershipDetails = {
			queueCount: 0,
			callWaitingCount: 0,
			extension: '',
		};
		membershipDetails.extension = requestParams.extension;
		const queueSummary = Promise.await(this.commandHandler.executeCommand(Commands.queue_summary)) as IVoipConnectorResult;
		for (const queue of queueSummary.result as IQueueSummary[]) {
			const queueDetails = Promise.await(this.commandHandler.executeCommand(
				Commands.queue_details,
				{ queueName: queue.name })) as IVoipConnectorResult;
			this.logger.debug({ msg: 'API = voip/queues.getCallWaitingInQueuesForThisExtension queue details = ', result: queueDetails });
			if (!(queueDetails.result as unknown as IQueueDetails).members) {
				// Go to the next queue if queue does not have any
				// memmbers.
				continue;
			}
			const isAMember = (queueDetails.result as unknown as IQueueDetails).members.some(
				(element) => element.name.endsWith(requestParams.extension),
			);
			if (!isAMember) {
				// Current extension is not a member of queue in question.
				// continue with next queue.
				continue;
			}
			membershipDetails.callWaitingCount += Number((queueDetails.result as unknown as IQueueDetails).calls);
			membershipDetails.queueCount++;
		}
		const result: IVoipConnectorResult = {
			result: membershipDetails,
		};
		return Promise.resolve(result);
	}

	async getConnectorVersion(): Promise<string> {
		const version = this.commandHandler.getVersion();
		return Promise.resolve(version);
	}

	async getExtensionList(): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(Commands.extension_list, undefined);
	}

	async getExtensionDetails(requestParams: any): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(
			Commands.extension_info,
			requestParams);
	}

	async getRegistrationInfo(requestParams: any): Promise<IVoipConnectorResult> {
		const config: IVoipServerConfig = Promise.await(
			this.getServerConfigData(ServerType.CALL_SERVER),
		) as unknown as IVoipServerConfig;

		if (!config) {
			this.logger.warn({ msg: 'API = connector.extension.getRegistrationInfo callserver settings not found' });
			return Promise.reject('Not found');
		}

		const endpointDetails = Promise.await(this.commandHandler.executeCommand(
			Commands.extension_info,
			requestParams,
		)) as IVoipConnectorResult;
		const callServerConfig: ICallServerConfigData = config.configData as ICallServerConfigData;
		const extensionDetails: IExtensionDetails = endpointDetails.result as unknown as IExtensionDetails;
		const extensionRegistrationInfo: IRegistrationInfo = {
			host: config.host,
			callServerConfig,
			extensionDetails,
		};
		return Promise.resolve({
			result: extensionRegistrationInfo,
		});
	}

	async handleEvent(event: string, room: IRoom, user: IUser, comment?: string): Promise<void> {
		const message = {
			t: event,
			msg: comment,
			groupable: false,
		};

		// TODO: Check room is voip
		// TODO: Check event is valid voip event
		// TODO: Add events (messageTypes) to IMessage interface
		await sendMessage(user, message, room);
	}
}
