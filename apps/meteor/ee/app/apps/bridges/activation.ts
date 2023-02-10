import { AppActivationBridge as ActivationBridge } from '@rocket.chat/apps-engine/server/bridges/AppActivationBridge';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { Users } from '@rocket.chat/models';

import type { AppServerOrchestrator } from '../orchestrator';

export class AppActivationBridge extends ActivationBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
	}

	protected async appAdded(app: ProxiedApp): Promise<void> {
		await this.orch.getNotifier().appAdded(app.getID());
	}

	protected async appUpdated(app: ProxiedApp): Promise<void> {
		await this.orch.getNotifier().appUpdated(app.getID());
	}

	protected async appRemoved(app: ProxiedApp): Promise<void> {
		await this.orch.getNotifier().appRemoved(app.getID());
	}

	protected async appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void> {
		const userStatus = ['auto_enabled', 'manually_enabled'].includes(status) ? 'online' : 'offline';

		await Users.updateStatusByAppId(app.getID(), userStatus);

		await this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}

	protected async actionsChanged(): Promise<void> {
		await this.orch.getNotifier().actionsChanged();
	}
}
