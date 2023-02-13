import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { AppDetailChangesBridge as DetailChangesBridge } from '@rocket.chat/apps-engine/server/bridges/AppDetailChangesBridge';

import type { AppServerOrchestrator } from '../orchestrator';

import { AppEvents } from '../../../../app/apps/server/communication';

export class AppDetailChangesBridge extends DetailChangesBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected onAppSettingsChange(appId: string, setting: ISetting): void {
		try {
			this.orch.notifyAppEvent(AppEvents.APP_SETTING_UPDATED, appId, setting);
		} catch (e) {
			console.warn('failed to notify about the setting change.', appId);
		}
	}
}
