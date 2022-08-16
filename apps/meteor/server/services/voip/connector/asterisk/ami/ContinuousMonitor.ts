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
import type { Db } from 'mongodb';
import type {
	IPbxEvent,
	IQueueDetails,
	IAgentCalledEvent,
	IAgentConnectEvent,
	IEventBase,
	IQueueCallerAbandon,
	IQueueCallerJoinEvent,
	IQueueEvent,
	IQueueMemberAdded,
	IQueueMemberRemoved,
	ICallOnHold,
	ICallUnHold,
	IContactStatus,
	ICallHangup,
	IDialingEvent,
} from '@rocket.chat/core-typings';
import {
	isIDialingEvent,
	isIAgentCalledEvent,
	isIAgentConnectEvent,
	isIQueueCallerAbandonEvent,
	isIQueueCallerJoinEvent,
	isIQueueMemberAddedEvent,
	isIQueueMemberRemovedEvent,
	isICallOnHoldEvent,
	isICallUnHoldEvent,
	isIContactStatusEvent,
	isICallHangupEvent,
} from '@rocket.chat/core-typings';
import { Users, PbxEvents } from '@rocket.chat/models';

import { Command, CommandType } from '../Command';
import { Logger } from '../../../../../lib/logger/Logger';
import { CallbackContext } from './CallbackContext';
// import { sendMessage } from '../../../../../../app/lib/server/functions/sendMessage';
import { api } from '../../../../../sdk/api';
import { ACDQueue } from './ACDQueue';
import { Commands } from '../Commands';

export class ContinuousMonitor extends Command {
	private logger: Logger;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		super(command, parametersNeeded, db);
		this._type = CommandType.AMI;
		this.logger = new Logger('ContinuousMonitor');
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
		return (await Users.findByExtensions(extensionList).toArray()).map((u) => u._id);
	}

	// Todo : Move this out of connector. This class is a busy class.
	// Not sure if we should do it here.
	private async getQueueDetails(queueName: string): Promise<IQueueDetails> {
		const queue = new ACDQueue(Commands.queue_details.toString(), true, this.db);
		queue.connection = this.connection;
		const queueDetails = await queue.executeCommand({ queueName });
		return queueDetails.result as unknown as IQueueDetails;
	}

	async processQueueMembershipChange(event: IQueueMemberAdded | IQueueMemberRemoved): Promise<void> {
		const extension = event.interface.toLowerCase().replace('pjsip/', '');
		const { queue } = event;
		const queueDetails = await this.getQueueDetails(queue);
		const { calls } = queueDetails;
		const user = await Users.findOneByExtension(extension, {
			projection: {
				_id: 1,
				username: 1,
				extension: 1,
			},
		});
		if (user) {
			if (isIQueueMemberAddedEvent(event)) {
				api.broadcast(`voip.events`, user._id, { data: { queue, queuedCalls: calls }, event: 'queue-member-added' });
			} else if (isIQueueMemberRemovedEvent(event)) {
				api.broadcast(`voip.events`, user._id, { event: 'queue-member-removed', data: { queue, queuedCalls: calls } });
			}
		}
	}

	async processAgentCalled(event: IAgentCalledEvent): Promise<void> {
		this.logger.debug(`Got new event queue.agentcalled at ${event.queue}`);
		const extension = event.interface.toLowerCase().replace('pjsip/', '');
		const user = await Users.findOneByExtension(extension, {
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

		api.broadcast('voip.events', user._id, { event: 'agent-called', data: { callerId, queue: event.queue } });
		// api.broadcast('queue.agentcalled', user._id, event.queue, callerId);
	}

	async storePbxEvent(event: IQueueEvent | IContactStatus, eventName: string): Promise<void> {
		try {
			const now = new Date();
			// store pbx event
			if (isIContactStatusEvent(event)) {
				// This event represents when an agent drops a call because of disconnection
				// May happen for any reason outside of our control, like closing the browswer
				// Or network/power issues
				await PbxEvents.insertOne({
					event: eventName,
					uniqueId: `${eventName}-${event.contactstatus}-${now.getTime()}`,
					ts: now,
					agentExtension: event.aor,
				});

				return;
			}

			let uniqueId = `${eventName}-${event.calleridnum}-`;
			if (event.queue) {
				uniqueId += `${event.queue}-${event.uniqueid}`;
			} else {
				uniqueId += `${event.channel}-${event.destchannel}-${event.uniqueid}`;
			}
			// NOTE: using the uniqueId prop of event is not the recommented approach, since it's an opaque ID
			// However, since we're not using it for anything special, it's a "fair use"
			// uniqueId => {server}/{epoch}.{id of channel associated with this call}
			await PbxEvents.insertOne({
				uniqueId,
				event: eventName,
				ts: now,
				phone: event.calleridnum,
				queue: event.queue,
				holdTime: isIAgentConnectEvent(event) ? event.holdtime : '',
				callUniqueId: event.uniqueid,
				callUniqueIdFallback: event.linkedid,
				agentExtension: event?.connectedlinenum,
			});
		} catch (e) {
			this.logger.debug('Event was handled by other instance');
		}
	}

	async processAndBroadcastEventToAllQueueMembers(
		event: IQueueCallerJoinEvent | IQueueCallerAbandon | IAgentConnectEvent | ICallHangup,
	): Promise<void> {
		this.logger.debug(`Broadcasting to memebers, event =  ${event.event}`);
		const queueDetails = await this.getQueueDetails(event.queue);
		const members = await this.getMembersFromQueueDetails(queueDetails);
		switch (event.event) {
			case 'QueueCallerJoin': {
				const callerId = {
					id: event.calleridnum,
					name: event.calleridname,
				};
				await this.storePbxEvent(event, 'QueueCallerJoin');
				this.logger.debug(`Broadcasting event queue.callerjoined to ${members.length} agents on queue ${event.queue}`);
				members.forEach((m) => {
					api.broadcast('voip.events', m, { event: 'caller-joined', data: { callerId, queue: event.queue, queuedCalls: event.count } });
				});
				break;
			}
			case 'QueueCallerAbandon': {
				const { calls } = queueDetails;
				await this.storePbxEvent(event, 'QueueCallerAbandon');
				this.logger.debug(`Broadcasting event queue.callabandoned to ${members.length} agents on queue ${event.queue}`);
				members.forEach((m) => {
					api.broadcast('voip.events', m, { event: 'call-abandoned', data: { queue: event.queue, queuedCallAfterAbandon: calls } });
				});
				break;
			}
			case 'AgentConnect': {
				const { calls } = queueDetails;

				await this.storePbxEvent(event, 'AgentConnect');
				this.logger.debug(`Broadcasting event queue.agentconnected to ${members.length} agents on queue ${event.queue}`);
				members.forEach((m) => {
					// event.holdtime signifies wait time in the queue.
					api.broadcast('voip.events', m, {
						event: 'agent-connected',
						data: { queue: event.queue, queuedCalls: calls, waitTimeInQueue: event.holdtime },
					});
				});
				break;
			}
			default:
				this.logger.error(`Cant process ${event}. No handlers associated with it`);
		}
	}

	async processHoldUnholdEvents(event: ICallOnHold | ICallUnHold): Promise<void> {
		return this.storePbxEvent(event, event.event);
	}

	async processHangupEvents(event: ICallHangup): Promise<void> {
		return this.storePbxEvent(event, event.event);
	}

	async processContactStatusEvent(event: IContactStatus): Promise<void> {
		if (event.contactstatus === 'Removed') {
			// Room closing logic should be added here for the aor
			// aor signifies address of record, which should be used for
			// fetching the room for which serverBy = event.aor
			return this.storePbxEvent(event, event.event);
		}
	}

	async isCallBeginEventPresent(pbxEvent: IPbxEvent | null, uniqueId: string): Promise<boolean> {
		if (pbxEvent && pbxEvent.callUniqueId === uniqueId) {
			switch (pbxEvent.event.toLowerCase()) {
				case 'queuecallerjoin':
				case 'agentconnect':
					return true;
				default:
					return false;
			}
		}
		return false;
	}

	async manageDialEvents(event: IDialingEvent): Promise<void> {
		const pbxEvent = await PbxEvents.findOneByUniqueId(event.uniqueid);
		/**
		 * Dial events currently are used for detecting the outbound call
		 * This will later be used for matching call events.
		 *
		 * Dial events are generated even for the queued calls but queue events
		 * are not generated for direct calls (either outbound or directly to an agent).
		 *
		 * isCallBeginEventPresent checks if the call was off the queue. If it was,
		 * we would not try add the dial-event to the pbx database.
		 */
		if (await this.isCallBeginEventPresent(pbxEvent, event.uniqueid)) {
			return;
		}

		if (event.dialstatus.toLowerCase() !== 'answer' && event.dialstatus.toLowerCase() !== 'ringing') {
			this.logger.warn(`Received unexpected event ${event.event} dialstatus =  ${event.dialstatus}`);
			return;
		}
		/** This function adds necessary data to
		 * pbx_events database for outbound calls.
		 *
		 * event?.connectedlinenum is the extension/phone number that is being called
		 * and event.calleridnum is the extension that is initiating a call.
		 */
		await PbxEvents.insertOne({
			uniqueId: `${event.event}-${event.calleridnum}-${event.channel}-${event.destchannel}-${event.uniqueid}`,
			event: event.event,
			ts: new Date(),
			phone: event?.connectedlinenum,
			callUniqueId: event.uniqueid,
			callUniqueIdFallback: event.linkedid,
			agentExtension: event.calleridnum,
		});
	}

	async onEvent(event: IEventBase): Promise<void> {
		this.logger.debug(`Received event ${event.event}`);
		if (isIDialingEvent(event)) {
			return this.manageDialEvents(event);
		}
		// Event received when a queue member is notified of a call in queue
		if (isIAgentCalledEvent(event)) {
			return this.processAgentCalled(event);
		}

		// Event received when a call joins queue
		if (isIQueueCallerJoinEvent(event)) {
			return this.processAndBroadcastEventToAllQueueMembers(event);
		}

		if (isIAgentConnectEvent(event)) {
			return this.processAndBroadcastEventToAllQueueMembers(event);
		}

		if (isIQueueCallerAbandonEvent(event)) {
			return this.processAndBroadcastEventToAllQueueMembers(event);
		}

		if (isIQueueMemberAddedEvent(event) || isIQueueMemberRemovedEvent(event)) {
			return this.processQueueMembershipChange(event);
		}

		if (isICallOnHoldEvent(event) || isICallUnHoldEvent(event)) {
			return this.processHoldUnholdEvents(event);
		}

		if (isIContactStatusEvent(event)) {
			return this.processContactStatusEvent(event);
		}

		if (isICallHangupEvent(event)) {
			return this.processHangupEvents(event);
		}

		// Asterisk sends a metric ton of events, some may be useful but others doesn't
		// We need to check which ones we want to use in future, but until that moment, this log
		// Will be commented to avoid unnecesary noise. You can uncomment if you want to see all events
		this.logger.debug(`Cannot handle event ${event.event}`);
	}

	setupEventHandlers(): void {
		// Setup necessary command event handlers based on the command
		this.connection.on('queuecallerjoin', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentcalled', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('agentconnect', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuememberadded', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuememberremoved', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('queuecallerabandon', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('hold', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('unhold', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('contactstatus', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('hangup', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('dialend', new CallbackContext(this.onEvent.bind(this), this));
		this.connection.on('dialstate', new CallbackContext(this.onEvent.bind(this), this));
	}

	resetEventHandlers(): void {
		this.connection.off('queuecallerjoin', this);
		this.connection.off('agentcalled', this);
		this.connection.off('agentconnect', this);
		this.connection.off('queuememberadded', this);
		this.connection.off('queuememberremoved', this);
		this.connection.off('queuecallerabandon', this);
		this.connection.off('hold', this);
		this.connection.off('unhold', this);
		this.connection.off('contactstatus', this);
		this.connection.off('hangup', this);
		this.connection.off('dialend', this);
		this.connection.off('dialstate', this);
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
