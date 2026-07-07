type StartupCallback = () => void | Promise<void>;

const startupCallbacks: StartupCallback[] = [];
let startupDone = false;

/**
 * Replacement for `Meteor.startup`. Callbacks registered before boot are run in
 * registration order by `runStartupCallbacks`; once startup has completed,
 * new callbacks run immediately (same semantics as Meteor).
 */
export function onStartup(callback: StartupCallback): void {
	if (startupDone) {
		void callback();
		return;
	}
	startupCallbacks.push(callback);
}

/** Called once by the server entrypoint after core services are ready. */
export async function runStartupCallbacks(): Promise<void> {
	while (startupCallbacks.length) {
		const callback = startupCallbacks.shift() as StartupCallback;
		await callback();
	}
	startupDone = true;
}
