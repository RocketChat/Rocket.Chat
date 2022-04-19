/**
 * This class is a callback context for AMI event handlers.
 */

import { Command } from '../Command';
import { ICallbackContext } from '../ICallbackContext';

export class CallbackContext implements ICallbackContext {
	private callback: (event: any) => void;

	private ref: Command;

	constructor(callback: (event: any) => void, command: Command) {
		this.callback = callback;
		this.ref = command;
	}

	/**
	 * Checks whether the event's action id is same as the action id of this command's
	 * execution.
	 * If it is valid, calls the registered callback and returns true
	 * else returns false
	 */
	call(event: any): boolean {
		const pattern = new RegExp(this.ref.actionid);
		/**
		 *
		 * Though actionid remains unique with every action and for some
		 * actions it is not present, it makes sense to parse it as a regex
		 * if there is no exact match.
		 *
		 * This approach is used when we have continuous monitoring. But it is observed that the event
		 * we are interested in monitoring do not have actionid. (queuecallerjoin, agentcalled, agentconnect)
		 *
		 * Alternate way of handing it is that we check if event.actionid is absent,
		 * go ahead and call the callback.
		 *
		 * But we do not know if for all such |continuous monitoring| events, the actionid
		 * would be absent. Furthermore, it is futureproof if we want to
		 * continuously monitor the PBX.
		 * So the safest bet for |continuous monitoring events|
		 * right now is to pass .* in this.ref.actionid
		 * and if the exact match does not happen, try to match the regex.
		 *
		 */
		if (event.actionid === this.ref.actionid || pattern.test(event.actionid)) {
			this.callback(event);
			return true;
		}
		return false;
	}

	/**
	 * Checks whether the event's action id is same as the action id of this command's
	 * execution. Returns true if it is, else returns false
	 */
	isValidContext(actionid: any): boolean {
		return this.ref.actionid === actionid;
	}
}
