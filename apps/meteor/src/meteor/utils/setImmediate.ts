/**
 * A modern, high-performance implementation of setImmediate for browsers.
 * Uses MessageChannel to schedule a macrotask with near-zero delay.
 */

type ImmediateTask = (...args: any[]) => void;

// Store pending callbacks with unique IDs
const tasks = new Map<number, { callback: ImmediateTask; args: any[] }>();
let nextHandle = 1;

// Create the channel for messaging
const channel = new MessageChannel();
const port = channel.port2;

// Handle the message event (the "immediate" execution)
channel.port1.onmessage = (event: MessageEvent) => {
	const handle = event.data as number;
	const task = tasks.get(handle);

	if (task) {
		tasks.delete(handle);
		try {
			task.callback(...task.args);
		} catch (error) {
			// Re-throw error asynchronously to avoid breaking the message loop
			// and ensuring it bubbles up to window.onerror
			setTimeout(() => {
				throw error;
			}, 0);
		}
	}
};

/**
 * Schedules a function to run asynchronously as soon as possible
 * (in the next macrotask), bypassing the 4ms clamping of setTimeout.
 * * @param callback The function to execute.
 * @param args Arguments to pass to the function.
 * @returns A unique handle ID that can be passed to clearImmediate.
 */
export function setImmediate(callback: ImmediateTask, ...args: any[]): number {
	const handle = nextHandle++;
	tasks.set(handle, { callback, args });
	port.postMessage(handle);
	return handle;
}

/**
 * Cancels a task scheduled with setImmediate.
 * * @param handle The handle ID returned by setImmediate.
 */
export function clearImmediate(handle: number): void {
	tasks.delete(handle);
}
