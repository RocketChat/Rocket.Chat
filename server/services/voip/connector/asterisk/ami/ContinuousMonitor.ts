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
import { VoipEventsRaw } from '../../../../../../app/models/server/raw/VoipEvents';
import { RoomsRaw } from '../../../../../../app/models/server/raw/Rooms';
import { api } from '../../../../../sdk/api';
import { ACDQueue } from './ACDQueue';
import { Commands } from '../Commands';
import { IVoipConnectorResult } from '../../../../../../definition/IVoipConnectorResult';
import { IQueueDetails } from '../../../../../../definition/ACDQueues';

export class ContinuousMonitor extends Command {
	private logger: Logger;

	private filterData: any = undefined;

	private users: UsersRaw;

	private rooms: RoomsRaw;

	private events: VoipEventsRaw;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		super(command, parametersNeeded, db);
		this._type = CommandType.AMI;
		this.logger = new Logger('ContinuousMonitor');
		this.users = new UsersRaw(db.collection('users'));
		this.rooms = new RoomsRaw(db.collection('rocketchat_room'));
		this.events = new VoipEventsRaw(db.collection('rocketchat_voip_events'));
	}
	/*
	async processQueueCallerJoinOld(event: any): Promise<void> {
		this.events.addVoipEvent(event.event.toLowerCase(), event.queue, {
			callwaitingcount: event.count,
		});
		const cursor = await this.events.findLatest(event.event.toLowerCase(), event.queue);
		cursor.forEach((event: IVoipEvent | null) => {
			this.logger.error({ msg: 'ROCKETCHAT_DEBUG4', event });
		});

	}
	*/

	// Todo : Move this out of connector. This class is a busy class.
	// Not sure if we should do it here.
	private async findMemberUsers(queueName: string): Promise<string[]> {
		const queue = new ACDQueue(Commands.queue_details.toString(), true);
		queue.connection = this.connection;
		const userIds: string[] = [];
		const queueDetails = Promise.await(queue.executeCommand({ queueName })) as IVoipConnectorResult;
		const { members } = queueDetails.result as unknown as IQueueDetails;
		if (!members) {
			return [];
		}
		for (let i = 0; i < members.length; i++) {
			const extension = members[i].name.toLowerCase().replace('pjsip/', '');
			const user = Promise.await(this.users.findOneByExtension(extension));
			if (user) {
				userIds.push(user._id);
			}
		}
		this.logger.error({ msg: 'ROCKETCHAT_DEBUG members = ', userIds });
		return userIds;
	}

	async processQueueCallerJoin(event: any): Promise<void> {
		const members = Promise.await(this.findMemberUsers(event.queue));
		const callerId = {
			id: event.calleridnum,
			name: event.calleridname,
		};
		// Broadcast for all the members in the queue.
		for (let i = 0; i < members.length; i++) {
			api.broadcast('queue.callerjoined', members[i], event.queue, callerId, event.count);
		}
	}

	async processAgentCalled(event: any): Promise<void> {
		/*
		const message = {
			t: 'test',
			msg: `Got call from ${event.queue}`,
			groupable: false,
		};
		const room = await this.rooms.findOneById('GENERAL');
		*/
		this.logger.error({ msg: 'ROCKETCHAT_DEBUG2', no: event.destcalleridnum });
		const user = await this.users.findOneByExtension(event.destcalleridnum, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		});
		/*
		if (user) {
			// this.logger.error({ msg: 'ROCKETCHAT_DEBUG3' });
			await sendMessage(user, message, room);
			// this.logger.error({ msg: 'onEvent', event, user });
		}
		*/
		if (user) {
			this.logger.error({ msg: 'ROCKETCHAT_DEBUG ', no: event.queue });
			api.broadcast('queue.agentcalled', user._id, event.queue);
		}
	}

	async onEvent(event: any): Promise<void> {
		// this.logger.error({ msg: 'onEvent', event });
		switch (event.event.toLowerCase()) {
			case 'queuecallerjoin': {
				await this.processQueueCallerJoin(event);
				break;
			}
			case 'agentcalled': {
				await this.processAgentCalled(event);
				break;
			}
		}
	}

	setupEventHandlers(): void {
		// Setup necessary command event handlers based on the command
		this.connection.on('queuecallerjoin', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentcalled', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentconnect', new CallbackContext(this.onEvent.bind(this), this));
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
