/**
 * This class is responsible for handling ACD Queue summary
 * @remarks
 */
import { Db } from 'mongodb';
import type { IVoipConnectorResult } from '@rocket.chat/core-typings';

import { Command, CommandType } from '../Command';
import { Logger } from '../../../../../lib/logger/Logger';
import { Commands } from '../Commands';
import { CallbackContext } from './CallbackContext';

export class ACDQueue extends Command {
	private logger: Logger;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		super(command, parametersNeeded, db);
		this._type = CommandType.AMI;
		this.logger = new Logger('ACDQueue');
	}

	onQueueSummary(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({
				msg: 'onQueueSummary() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		const queue = {
			name: event.queue,
			loggedin: event.loggedin,
			available: event.available,
			callers: event.callers,
			holdtime: event.holdtime,
			talktime: event.talktime,
			logestholdtime: event.logestholdtime,
		};
		const { result } = this;
		if (result.queueSummary) {
			result.queueSummary.push(queue);
		} else {
			result.queueSummary = [];
			result.queueSummary.push(queue);
		}
	}

	onQueueSummaryComplete(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({
				msg: 'onQueueSummaryComplete() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		this.resetEventHandlers();
		const { result } = this;
		if (!result.queueSummary) {
			this.logger.info({ msg: 'No Queues available' });
			result.queueSummary = [];
		}
		this.returnResolve({ result: result.queueSummary } as IVoipConnectorResult);
	}

	/**  Callback for receiving Queue parameters for queuestatus action.
	 *
	 */
	onQueueParams(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({
				msg: 'onQueueParams() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		const queue = {
			name: event.queue,
			strategy: event.strategy,
			calls: event.calls,
			holdtime: event.holdtime,
			talktime: event.talktime,
			completed: event.completed,
			abandoned: event.abandoned,
			logestholdtime: event.logestholdtime,
		};
		this.result.queueStatus = queue;
	}

	/**  Callback for receiving Queue members for queuestatus action.
	 *
	 */
	onQueueMember(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({
				msg: 'onQueueMember() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		const member = {
			name: event.name,
			location: event.location,
			stateinterface: event.stateinterface,
			membership: event.membership,
			penalty: event.penalty,
			callstaken: event.callstaken,
			lastcall: event.lastcall,
			lastpause: event.lastpause,
			incall: event.incall,
			status: event.status,
			paused: event.paused,
			pausedreason: event.pausedreason,
			wrapuptime: event.wrapuptime,
		};
		if (this.result.queueStatus.name !== event.queue) {
			this.logger.error({ msg: `onQueueMember() : Unknown error. Queue ${event.queue} not found` });
		} else {
			if (!this.result.queueStatus.members) {
				this.result.queueStatus.members = [];
			}
			this.result.queueStatus.members.push(member);
		}
	}

	/**  Callback when all the data is received for queuestatus action.
	 *
	 */
	onQueueStatusComplete(event: any): void {
		if (event.actionid !== this.actionid) {
			this.logger.error({
				msg: 'onQueueStatusComplete() Unusual behavior. ActionId does not belong to this object',
				eventActionId: event.actionid,
				actionId: this.actionid,
			});
			return;
		}
		this.resetEventHandlers();
		const { result } = this;
		this.returnResolve({ result: result.queueStatus } as IVoipConnectorResult);
	}

	/**
	 * Callback for indicatiing command execution status.
	 * Received actionid for the first time.
	 */
	onActionResult(error: any, result: any): void {
		if (error) {
			this.logger.error({ msg: 'onActionResult()', error: JSON.stringify(error) });
			this.returnReject(`error${error} while executing command`);
		} else {
			// Set up actionid for future reference in case of success.
			this.actionid = result.actionid;
		}
	}

	setupEventHandlers(): void {
		// Setup necessary command event handlers based on the command
		switch (this.commandText) {
			case Commands.queue_summary.toString(): {
				this.connection.on('queuesummary', new CallbackContext(this.onQueueSummary.bind(this), this));
				this.connection.on('queuesummarycomplete', new CallbackContext(this.onQueueSummaryComplete.bind(this), this));
				break;
			}
			case Commands.queue_details.toString(): {
				this.connection.on('queueparams', new CallbackContext(this.onQueueParams.bind(this), this));
				this.connection.on('queuemember', new CallbackContext(this.onQueueMember.bind(this), this));
				this.connection.on('queuestatuscomplete', new CallbackContext(this.onQueueStatusComplete.bind(this), this));
				break;
			}
			default: {
				this.logger.error({ msg: `setupEventHandlers() : Unimplemented ${this.commandText}` });
				break;
			}
		}
	}

	resetEventHandlers(): void {
		switch (this.commandText) {
			case Commands.queue_summary.toString(): {
				this.connection.off('queuesummary', this);
				this.connection.off('queuesummarycomplete', this);
				break;
			}
			case Commands.queue_details.toString(): {
				this.connection.off('queueparams', this);
				this.connection.off('queuemember', this);
				this.connection.off('queuestatuscomplete', this);
				break;
			}
			default: {
				this.logger.error({ msg: `resetEventHandlers() : Unimplemented ${this.commandText}` });
				break;
			}
		}
	}

	async executeCommand(data: any): Promise<IVoipConnectorResult> {
		let amiCommand = {};
		// set up the specific action based on the value of |Commands|
		if (this.commandText === Commands.queue_summary.toString()) {
			amiCommand = {
				action: 'queuesummary',
			};
		} else if (this.commandText === Commands.queue_details.toString()) {
			amiCommand = {
				action: 'queuestatus',
				queue: data.queueName,
			};
		}
		this.logger.debug({ msg: `Executing AMI command ${JSON.stringify(amiCommand)}`, data });
		const actionResultCallback = this.onActionResult.bind(this);
		const eventHandlerSetupCallback = this.setupEventHandlers.bind(this);
		return super.prepareCommandAndExecution(amiCommand, actionResultCallback, eventHandlerSetupCallback);
	}
}
