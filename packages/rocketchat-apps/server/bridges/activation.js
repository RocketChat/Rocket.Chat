export class AppActivationBridge {
	constructor(orch) {
		this.orch = orch;
	}

	appAdded(app) {
		console.log(`The ${ app.getName() } App (${ app.getID() }) has been added.`);

		this.orch.getNotifier().appAdded(app.getID());
	}

	appUpdated(app) {
		console.log(`The ${ app.getName() } App (${ app.getID() }) has been updated.`);

		this.orch.getNotifier().appUpdated(app.getID());
	}

	appRemoved(app) {
		console.log(`The ${ app.getName() } App (${ app.getID() }) has been removed.`);

		this.orch.getNotifier().appRemoved(app.getID());
	}

	appStatusChanged(app, status) {
		console.log(`The ${ app.getName() } App (${ app.getID() }) status has changed: ${ status }`);

		this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}
}
