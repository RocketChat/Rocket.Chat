export class AppActivationBridge {
	constructor(orch) {
		this.orch = orch;
	}

	appEnabled(app) {
		console.log(`The App ${ app.getName() } (${ app.getID() }) has been enabled.`);
	}

	appDisabled(app) {
		console.log(`The App ${ app.getName() } (${ app.getID() }) has been disabled.`);
	}

	appLoaded(app, enabled) {
		console.log(`The App ${ app.getName() } (${ app.getID() }) has been loaded and enabled? ${ enabled }`);

		if (enabled) {
			this.orch.getNotifier().appAdded(app.getID());
		}
	}

	appUpdated(app, enabled) {
		console.log(`The App ${ app.getName() } (${ app.getID() }) has been updated and enabled? ${ enabled }`);

		if (enabled) {
			this.orch.getNotifier().appUpdated(app.getID());
		}
	}

	appRemoved(app) {
		console.log(`The App ${ app.getName() } (${ app.getID() }) has been removed.`);

		this.orch.getNotifier().appRemoved(app.getID());
	}
}
