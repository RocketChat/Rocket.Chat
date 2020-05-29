export class AppDetailChangesBridge {
	constructor(orch) {
		this.orch = orch;
	}

	onAppSettingsChange(appId, setting) {
		try {
			this.orch.getNotifier().appSettingsChange(appId, setting);
		} catch (e) {
			console.warn('failed to notify about the setting change.', appId);
		}
	}
}
