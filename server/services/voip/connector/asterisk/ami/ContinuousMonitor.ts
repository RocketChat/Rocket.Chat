/**
 * This class is responsible for continuously monitoring the activity happening
 * on the asterisk. It is suggested that this class should be used only
 * for events which needs a continuous monitoring. For other types of action based events
 * such as queuesummary etc, Other classes should be used.
 *
 *
 * @remarks :
 * To begin with, we need 2 events tobe monitored
 * QueueCallerJoin.count would give us the total elements in the queue.
 * AgentCalled.queue and AgentCalled.destcalleridnum to signify which agent is currently ringing to serve the call.
 * (AgentConnect.calleridnum, connectedlinenum, queue) to signify which agent ansered the call from which queue.
 *
 */
import { Db } from 'mongodb';

import { Command, CommandType } from '../Command';
import { Logger } from '../../../../../lib/logger/Logger';
import { CallbackContext } from './CallbackContext';
// import { sendMessage } from '../../../../../../app/lib/server/functions/sendMessage';
import { UsersRaw } from '../../../../../../app/models/server/raw/Users';
import { api } from '../../../../../sdk/api';
import { ACDQueue } from './ACDQueue';
import { Commands } from '../Commands';
import { IQueueDetails } from '../../../../../../definition/ACDQueues';
import {
	IAgentCalledEvent,
	IEventBase,
	IQueueCallerAbandon,
	IQueueCallerJoinEvent,
	IQueueMemberAdded,
	IQueueMemberRemoved,
	isIAgentCalledEvent,
	isIAgentConnectEvent,
	isIQueueCallerAbandonEvent,
	isIQueueCallerJoinEvent,
	isIQueueMemberAddedEvent,
	isIQueueMemberRemovedEvent,
} from '../../../../../../definition/voip/IEvents';

export class ContinuousMonitor extends Command {
	private logger: Logger;

	private users: UsersRaw;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		super(command, parametersNeeded, db);
		this._type = CommandType.AMI;
		this.logger = new Logger('ContinuousMonitor');
		this.users = new UsersRaw(db.collection('users'));
	}

	private async getMembersFromQueueDetails(queueDetails: IQueueDetails): Promise<string[]> {
		const { members } = queueDetails;
		if (!members) {
			return [];
		}

		const extensionList = members.map((m) => {
			return m.name.toLowerCase().replace('pjsip/', '');
		});

		this.logger.debug(`Finding members of queue ${queueDetails.name} between users`);
		return (await this.users.findByExtensions(extensionList).toArray()).map((u) => u._id);
	}

	// Todo : Move this out of connector. This class is a busy class.
	// Not sure if we should do it here.
	private async getQueueDetails(queueName: string): Promise<IQueueDetails> {
		const queue = new ACDQueue(Commands.queue_details.toString(), true);
		queue.connection = this.connection;
		const queueDetails = await queue.executeCommand({ queueName });
		return queueDetails.result as unknown as IQueueDetails;
	}

	/*
	private async findMemberUsers(queueName: string): Promise<string[]> {
		const queue = new ACDQueue(Commands.queue_details.toString(), true);
		queue.connection = this.connection;
		const queueDetails = await queue.executeCommand({ queueName });
		const { members } = queueDetails.result as unknown as IQueueDetails;
		if (!members) {
			return [];
		}

		const extensionList = members.map((m) => {
			return m.name.toLowerCase().replace('pjsip/', '');
		});

		this.logger.debug(`Finding members of queue ${queueName} between users`);
		return (await this.users.findByExtensions(extensionList).toArray()).map((u) => u._id);
	}
	*/
	async processQueueCallerJoin(event: IQueueCallerJoinEvent): Promise<void> {
		this.logger.debug(`Got new event queue.callerjoined at ${event.queue}`);
		const queueDetails = await this.getQueueDetails(event.queue);
		const members = await this.getMembersFromQueueDetails(queueDetails);
		const callerId = {
			id: event.calleridnum,
			name: event.calleridname,
		};

		this.logger.debug(`Broadcasting event queue.callerjoined to ${members.length} agents on queue ${event.queue}`);
		members.forEach((m) => {
			api.broadcast('queue.callerjoined', m, event.queue, callerId, event.count);
		});
	}

	async processQueueMembershipChange(event: IQueueMemberAdded | IQueueMemberRemoved): Promise<void> {
		const extension = event.interface.toLowerCase().replace('pjsip/', '');
		const queueName = event.queue;
		const queueDetails = await this.getQueueDetails(queueName);
		const { calls } = queueDetails;
		const user = await this.users.findOneByExtension(extension, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		});
		if (user) {
			if (isIQueueMemberAddedEvent(event)) {
				api.broadcast(`queue.queuememberadded`, user._id, queueName, calls);
			} else if (isIQueueMemberRemovedEvent(event)) {
				api.broadcast(`queue.queuememberremoved`, user._id, queueName, calls);
			}
		}
	}

	async processAgentCalled(event: IAgentCalledEvent): Promise<void> {
		this.logger.debug(`Got new event queue.agentcalled at ${event.queue}`);
		const extension = event.interface.toLowerCase().replace('pjsip/', '');
		const user = await this.users.findOneByExtension(extension, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		});

		if (!user) {
			this.logger.debug(`Cannot broadcast queue.agentcalled. No agent found at extension ${extension}`);
			return;
		}

		this.logger.debug(`Broadcasting event queue.agentcalled to ${user._id}@${event.queue} on extension ${extension}`);
		const callerId = {
			id: event.calleridnum,
			name: event.calleridname,
		};
		api.broadcast('queue.agentcalled', user._id, event.queue, callerId);
	}

	async processQueueAbandoned(event: IQueueCallerAbandon): Promise<void> {
		const queueName = event.queue;
		const queueDetails = await this.getQueueDetails(queueName);
		const members = await this.getMembersFromQueueDetails(queueDetails);
		const { calls } = queueDetails;

		members.forEach((m) => {
			api.broadcast('queue.callabandoned', m, queueName, calls);
		});
	}

	async onEvent(event: IEventBase): Promise<void> {
		this.logger.debug(`Received event ${event.event}`);
		if (isIQueueCallerJoinEvent(event)) {
			return this.processQueueCallerJoin(event);
		}

		if (isIAgentCalledEvent(event)) {
			return this.processAgentCalled(event);
		}

		if (isIAgentConnectEvent(event)) {
			this.logger.debug(`Cannot handle event ${event.event}`);
			// return;
		}

		if (isIQueueMemberAddedEvent(event) || isIQueueMemberRemovedEvent(event)) {
			return this.processQueueMembershipChange(event);
		}

		if (isIQueueCallerAbandonEvent(event)) {
			this.logger.debug(`Cannot handle event ${event.event}`);
			return this.processQueueAbandoned(event);
		}

		// Asterisk sends a metric ton of events, some may be useful but others doesn't
		// We need to check which ones we want to use in future, but until that moment, this log
		// Will be commented to avoid unnecesary noise. You can uncomment if you want to see all events
		// this.logger.debug(`Cannot handle event ${event.event}`);
	}

	setupEventHandlers(): void {
		// Setup necessary command event handlers based on the command
		this.connection.on('queuecallerjoin', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentcalled', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentconnect', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuememberadded', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuememberremoved', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuecallerabandon', new CallbackContext(this.onEvent.bind(this), this));
	}

	resetEventHandlers(): void {
		this.connection.off('queuecallerjoin', this);
		this.connection.off('agentcalled', this);
		this.connection.off('agentconnect', this);
	}

	initMonitor(_data: any): boolean {
		/**
		 * See the implementation of |call| function in CallbackContext to understand
		 * why we are using regex here.
		 */
		this.actionid = '.*';
		this.setupEventHandlers();
		return true;
	}

	cleanMonitor(): boolean {
		this.resetEventHandlers();
		return true;
	}
}
