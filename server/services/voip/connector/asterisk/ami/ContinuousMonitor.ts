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
import { sendMessage } from '../../../../../../app/lib/server/functions/sendMessage';
import { UsersRaw } from '../../../../../../app/models/server/raw/Users';
import { RoomsRaw } from '../../../../../../app/models/server/raw/Rooms';

export class ContinuousMonitor extends Command {
	private logger: Logger;

	private filterData: any = undefined;

	private users: UsersRaw;

	private rooms: RoomsRaw;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		super(command, parametersNeeded, db);
		this._type = CommandType.AMI;
		this.logger = new Logger('ContinuousMonitor');
		this.users = new UsersRaw(db.collection('users'));
		this.rooms = new RoomsRaw(db.collection('rocketchat_room'));
	}

	async onEvent(event: any): Promise<void> {
		this.logger.error({ msg: 'ContinuousMonitor AMOL_DEBUG 6' });
		this.logger.error({ msg: 'onEvent', event });
		if (event.event.toLowerCase() === 'agentcalled') {
			this.logger.error({ msg: 'AMOL_DEBUG1' });
			const message = {
				t: 'test',
				msg: `Got call from ${event.queue}`,
				groupable: false,
			};
			const room = await this.rooms.findOneById('GENERAL');
			this.logger.error({ msg: 'AMOL_DEBUG2', no: event.destcalleridnum });
			const user = await this.users.findOneByExtension(event.destcalleridnum, {
				projection: {
					_id: 1,
					username: 1,
					extension: 1,
				},
			});
			if (user) {
				this.logger.error({ msg: 'AMOL_DEBUG3' });
				await sendMessage(user, message, room);
				this.logger.error({ msg: 'onEvent', event, user });
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
