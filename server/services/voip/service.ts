import { Db } from 'mongodb';

import { IVoipService } from '../../sdk/types/IVoipService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Logger } from '../../lib/logger/Logger';
import { VoipServerConfigurationRaw } from '../../../app/models/server/raw/VoipServerConfiguration';
import {
	ServerType,
	isICallServerConfigData,
	IVoipServerConfigBase,
	IVoipCallServerConfig,
	IVoipManagementServerConfig,
} from '../../../definition/IVoipServerConfig';
import { CommandHandler } from './connector/asterisk/CommandHandler';
import { CommandType } from './connector/asterisk/Command';
import { Commands } from './connector/asterisk/Commands';
import { IVoipConnectorResult } from '../../../definition/IVoipConnectorResult';
import { IQueueMembershipDetails, IRegistrationInfo, isIExtensionDetails } from '../../../definition/IVoipExtension';
import { IQueueDetails, IQueueSummary } from '../../../definition/ACDQueues';
import { getServerConfigDataFromSettings } from './lib/Helper';

export class VoipService extends ServiceClassInternal implements IVoipService {
	protected name = 'voip';

	private logger: Logger;

	// this will hold the multiple call server connection settings that can be supported
	// They should only be modified through this service
	private VoipServerConfiguration: VoipServerConfigurationRaw;

	commandHandler: CommandHandler;

	constructor(db: Db) {
		super();

		this.logger = new Logger('voip service');
		// TODO: If we decide to move away from this approach after the MVP, don't forget do do a migration to remove the collection!
		this.VoipServerConfiguration = new VoipServerConfigurationRaw(db.collection('rocketchat_voip_server_configuration'));

		this.commandHandler = new CommandHandler(db);
		try {
			Promise.await(this.commandHandler.initConnection(CommandType.AMI));
		} catch (error) {
			this.logger.error({ msg: `Error while initialising the connector. error = ${error}` });
		}
	}

	private async initManagementServerConnection(): Promise<void> {
		this.logger.info({ msg: 'initialiseManagementServer() initialising the connector' });
		await this.commandHandler.initConnection(CommandType.AMI);
	}

	/**
	 * @deprecated The method should not be used
	 */
	async addServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		await this.deactivateServerConfigDataIfAvailable(type);

		const existingConfig = await this.getServerConfigData(type);
		if (existingConfig) {
			throw new Error(`Error! There already exists an active record of type ${type}`);
		}

		const returnValue = !!(await this.VoipServerConfiguration.insertOne(config));
		if (returnValue && type === ServerType.MANAGEMENT) {
			// If we have added management server, initialise the connection to it.
			Promise.await(this.initManagementServerConnection());
		}
		return returnValue;
	}

	/**
	 * @deprecated The method should not be used
	 */
	async updateServerConfigData(config: Omit<IVoipServerConfigBase, '_id' | '_updatedAt'>): Promise<boolean> {
		const { type } = config;

		await this.deactivateServerConfigDataIfAvailable(type);

		const existingConfig = await this.getServerConfigData(type);
		if (!existingConfig) {
			throw new Error(`Error! No active record exists of type ${type}`);
		}

		await this.VoipServerConfiguration.updateOne({ type, active: true }, config);

		return true;
	}

	// in-future, if we want to keep a track of duration during which a server config was active, then we'd need to modify the
	// IVoipServerConfig interface and add columns like "valid_from_ts" and "valid_to_ts"
	/**
	 * @deprecated The method should not be used
	 */
	async deactivateServerConfigDataIfAvailable(type: ServerType): Promise<boolean> {
		await this.VoipServerConfiguration.updateMany({ type, active: true }, { $set: { active: false } });
		return true;
	}

	getServerConfigData(type: ServerType): IVoipCallServerConfig | IVoipManagementServerConfig {
		return getServerConfigDataFromSettings(type);
	}

	getConnector(): CommandHandler {
		return this.commandHandler;
	}

	async getQueueSummary(): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(Commands.queue_summary);
	}

	async getQueuedCallsForThisExtension({ extension }: { extension: string }): Promise<IVoipConnectorResult> {
		const membershipDetails: IQueueMembershipDetails = {
			queueCount: 0,
			callWaitingCount: 0,
			extension,
		};
		const queueSummary = (await this.commandHandler.executeCommand(Commands.queue_summary)) as IVoipConnectorResult;

		for await (const queue of queueSummary.result as IQueueSummary[]) {
			const queueDetails = (await this.commandHandler.executeCommand(Commands.queue_details, {
				queueName: queue.name,
			})) as IVoipConnectorResult;

			const details = queueDetails.result as IQueueDetails;

			if (!details.members.length) {
				// Go to the next queue if queue does not have any
				// memmbers.
				continue;
			}

			const isAMember = details.members.some((element) => element.name.endsWith(extension));
			if (!isAMember) {
				// Current extension is not a member of queue in question.
				// continue with next queue.
				continue;
			}

			membershipDetails.callWaitingCount += Number(details.calls);
			membershipDetails.queueCount++;
		}

		return { result: membershipDetails };
	}

	getConnectorVersion(): string {
		return this.commandHandler.getVersion();
	}

	async getExtensionList(): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(Commands.extension_list, undefined);
	}

	async getExtensionDetails(requestParams: { extension: string }): Promise<IVoipConnectorResult> {
		return this.commandHandler.executeCommand(Commands.extension_info, requestParams);
	}

	async getRegistrationInfo(requestParams: { extension: string }): Promise<{ result: IRegistrationInfo }> {
		const config = this.getServerConfigData(ServerType.CALL_SERVER);
		if (!config) {
			this.logger.warn({ msg: 'API = connector.extension.getRegistrationInfo callserver settings not found' });
			throw new Error('Not found');
		}

		const endpointDetails = await this.commandHandler.executeCommand(Commands.extension_info, requestParams);

		if (!isIExtensionDetails(endpointDetails.result)) {
			// TODO The result and the assertion doenst match amol please check
			throw new Error('getRegistrationInfo Invalid endpointDetails response');
		}
		if (!isICallServerConfigData(config.configData)) {
			throw new Error('getRegistrationInfo Invalid configData response');
		}

		const result = {
			host: config.host,
			callServerConfig: config.configData,
			extensionDetails: endpointDetails.result,
		};

		return {
			result,
		};
	}
}
