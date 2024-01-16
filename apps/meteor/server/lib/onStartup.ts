type StartupCallback = () => Promise<void>;

const callbackList: StartupCallback[] = [];
let hasStarted = false;

export const onStartup = (cb: StartupCallback): void => {
	if (hasStarted) {
		void cb();
		return;
	}

	callbackList.push(cb);
};

const runCallbacks = async (): Promise<void> => {
	for await (const cb of callbackList) {
		await cb();
	}

	callbackList.splice(0, callbackList.length);
};

Meteor.startup(async () => {
	hasStarted = true;
	await runCallbacks();
});
