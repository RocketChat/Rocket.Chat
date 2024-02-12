import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { AppDetailChangesBridge as DetailChangesBridge } from '@rocket.chat/apps-engine/server/bridges/AppDetailChangesBridge';

export class AppDetailChangesBridge extends DetailChangesBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected onAppSettingsChange(appId: string, setting: ISetting): void {
		try {
			this.orch.getNotifier().appSettingsChange(appId, setting);
		} catch (e) {
			console.warn('failed to notify about the setting change.', appId);
		}
	}
}
