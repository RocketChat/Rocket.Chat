export class RocketletActivationBridge {
	constructor(orch) {
		this.orch = orch;
	}

	rocketletEnabled(rocketlet) {
		console.log(`The Rocketlet ${ rocketlet.getName() } (${ rocketlet.getID() }) has been enabled.`);
	}

	rocketletDisabled(rocketlet) {
		console.log(`The Rocketlet ${ rocketlet.getName() } (${ rocketlet.getID() }) has been disabled.`);
	}

	rocketletLoaded(rocketlet, enabled) {
		console.log(`The Rocketlet ${ rocketlet.getName() } (${ rocketlet.getID() }) has been loaded and enabled? ${ enabled }`);

		if (enabled) {
			this.orch.getNotifier().rocketletAdded(rocketlet.getID());
		}
	}

	rocketletUpdated(rocketlet, enabled) {
		console.log(`The Rocketlet ${ rocketlet.getName() } (${ rocketlet.getID() }) has been updated and enabled? ${ enabled }`);

		if (enabled) {
			this.orch.getNotifier().rocketletUpdated(rocketlet.getID());
		}
	}

	rocketletRemoved(rocketlet) {
		console.log(`The Rocketlet ${ rocketlet.getName() } (${ rocketlet.getID() }) has been removed.`);

		this.orch.getNotifier().rocketletRemoved(rocketlet.getID());
	}
}
