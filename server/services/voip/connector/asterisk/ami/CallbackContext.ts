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
		if (event.actionid === this.ref.actionid) {
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
