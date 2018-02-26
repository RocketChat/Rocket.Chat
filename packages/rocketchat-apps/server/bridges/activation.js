export class AppActivationBridge {
	constructor(orch) {
		this.orch = orch;
	}

	appAdded(app) {
		this.orch.getNotifier().appAdded(app.getID());
	}

	appUpdated(app) {
		this.orch.getNotifier().appUpdated(app.getID());
	}

	appRemoved(app) {
		this.orch.getNotifier().appRemoved(app.getID());
	}

	appStatusChanged(app, status) {
		this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}
}
