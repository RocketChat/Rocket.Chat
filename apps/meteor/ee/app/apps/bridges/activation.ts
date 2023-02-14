import { AppActivationBridge as ActivationBridge } from '@rocket.chat/apps-engine/server/bridges/AppActivationBridge';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { Users } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../orchestrator';
import { AppEvents } from '../../../../app/apps/server/communication';

export class AppActivationBridge extends ActivationBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async appAdded(app: ProxiedApp): Promise<void> {
		this.orch.notifyAppEvent(AppEvents.APP_ADDED, app.getID());
	}

	protected async appUpdated(app: ProxiedApp): Promise<void> {
		this.orch.notifyAppEvent(AppEvents.APP_UPDATED, app.getID());
	}

	protected async appRemoved(app: ProxiedApp): Promise<void> {
		this.orch.notifyAppEvent(AppEvents.APP_REMOVED, app.getID());
	}

	protected async appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void> {
		const userStatus = ['auto_enabled', 'manually_enabled'].includes(status) ? 'online' : 'offline';

		await Users.updateStatusByAppId(app.getID(), userStatus);

		this.orch.notifyAppEvent(AppEvents.APP_STATUS_CHANGE, app.getID(), status);
	}

	protected async actionsChanged(): Promise<void> {
		this.orch.notifyAppEvent(AppEvents.APP_STATUS_CHANGE);
	}
}
