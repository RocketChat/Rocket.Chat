/**
 * Interface for callback context
 * @remarks
 * This interface represents a context for handling callbacks.
 * Classes interested in registering a callback would get a call from
 * the actual result processor code. While doing a callback, there are 2 important things
 * 1. Calling the registered function.
 * 2. Checking whether the callback context is associated with current execution context
 * */
export interface ICallbackContext {
	/**
	 * Interface method for calling
	 * associated handler.
	 */
	call(event: any): boolean;

	/**
	 * Interface method for validating the context of the callback
	 * when there parallel activity.
	 */

	isValidContext(actionid: any): boolean;
}
