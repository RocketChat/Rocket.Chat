import { Db } from 'mongodb';
import mem from 'mem';
import {
	ServerType,
	isICallServerConfigData,
	IVoipCallServerConfig,
	IVoipManagementServerConfig,
	IQueueMembershipDetails,
	IQueueMembershipSubscription,
	IRegistrationInfo,
	isIExtensionDetails,
} from '@rocket.chat/core-typings';
import type { IVoipConnectorResult, IQueueDetails, IQueueSummary, IManagementServerConnectionStatus } from '@rocket.chat/core-typings';

import { IVoipService } from '../../sdk/types/IVoipService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Logger } from '../../lib/logger/Logger';
import { CommandHandler } from './connector/asterisk/CommandHandler';
import { CommandType } from './connector/asterisk/Command';
import { Commands } from './connector/asterisk/Commands';
import { getServerConfigDataFromSettings, voipEnabled } from './lib/Helper';
import { api } from '../../sdk/api';

export class VoipService extends ServiceClassInternal implements IVoipService {
	protected name = 'voip';

	private logger: Logger;

	commandHandler: CommandHandler;

	private active = false;

	constructor(db: Db) {
		super();

		this.logger = new Logger('VoIPService');
		this.commandHandler = new CommandHandler(db);
		if (!voipEnabled()) {
			this.logger.warn({ msg: 'Voip is not enabled. Cant start the service' });
			return;
		}
		// Init from constructor if we already have
		// voip enabled by default while starting the server
		this.init();
	}

	async init(): Promise<void> {
		this.logger.info('Starting VoIP service');
		if (this.active) {
			this.logger.warn({ msg: 'VoIP service already started' });
			return;
		}

		try {
			await this.commandHandler.initConnection(CommandType.AMI);
			this.active = true;
			api.broadcast('connector.statuschanged', true);
			this.logger.info('VoIP service started');
		} catch (err) {
			this.logger.error({ msg: 'Error initializing VOIP service', err });
		}
	}

	async stop(): Promise<void> {
		this.logger.info('Stopping VoIP service');
		if (!this.active) {
			this.logger.warn({ msg: 'VoIP service already stopped' });
			return;
		}

		try {
			this.commandHandler.stop();
			this.active = false;
			api.broadcast('connector.statuschanged', false);
			this.logger.info('VoIP service stopped');
		} catch (err) {
			this.logger.error({ msg: 'Error stopping VoIP service', err });
		}
	}

	async refresh(): Promise<void> {
		this.logger.info('Restarting VoIP service due to settings changes');
		try {
			// Disable voip service
			await this.stop();
			// To then restart it
			await this.init();
		} catch (err) {
			this.logger.error({ msg: 'Error refreshing VoIP service', err });
		}
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

	private cachedQueueSummary(): () => Promise<IVoipConnectorResult> {
		// arbitrary 5 secs cache to prevent fetching this from asterisk too often
		return mem(this.getQueueSummary.bind(this), { maxAge: 5000 });
	}

	cachedQueueDetails(): () => Promise<{ name: string; members: string[] }[]> {
		return mem(this.getQueueDetails.bind(this), { maxAge: 5000 });
	}

	private async getQueueDetails(): Promise<{ name: string; members: string[] }[]> {
		const summary = await this.cachedQueueSummary()();
		const queues = (summary.result as unknown as IQueueSummary[]).map((q) => q.name);

		const queueInfo: { name: string; members: string[] }[] = [];
		for await (const queue of queues) {
			const queueDetails = (await this.commandHandler.executeCommand(Commands.queue_details, {
				queueName: queue,
			})) as IVoipConnectorResult;
			const details = queueDetails.result as IQueueDetails;
			if (!details.members || !details.members.length) {
				// Go to the next queue if queue does not have any
				// memmbers.
				continue;
			}
			queueInfo.push({
				name: queue,
				members: (queueDetails.result as IQueueDetails).members.map((member) => member.name.replace('PJSIP/', '')),
			});
		}

		return queueInfo;
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

	async getQueueMembership({ extension }: { extension: string }): Promise<IVoipConnectorResult> {
		const membershipDetails: IQueueMembershipSubscription = {
			queues: [],
			extension,
		};
		const queueSummary = (await this.commandHandler.executeCommand(Commands.queue_summary)) as IVoipConnectorResult;

		for await (const queue of queueSummary.result as IQueueSummary[]) {
			const queueDetails = (await this.commandHandler.executeCommand(Commands.queue_details, {
				queueName: queue.name,
			})) as IVoipConnectorResult;

			const details = queueDetails.result as IQueueDetails;

			if (!details.members || !details.members.length) {
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
			membershipDetails.queues.push(queue);
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
			this.logger.warn('Check call server settings, without them you wont be be able to send/receive calls on RocketChat');
			throw new Error('Not found');
		}

		const endpointDetails = await this.commandHandler.executeCommand(Commands.extension_info, requestParams);

		if (!isIExtensionDetails(endpointDetails.result)) {
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

	async checkManagementConnection(
		host: string,
		port: string,
		userName: string,
		password: string,
	): Promise<IManagementServerConnectionStatus> {
		this.logger.debug('Checking management server connection');
		return this.commandHandler.checkManagementConnection(host, port, userName, password);
	}

	async checkCallserverConnection(websocketUrl: string, protocol?: string): Promise<IManagementServerConnectionStatus> {
		this.logger.debug('Checking call server connection');
		return this.commandHandler.checkCallserverConnection(websocketUrl, protocol);
	}
}
