import type { IAppServerOrchestrator, AppStatus } from '@rocket.chat/apps';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import { AppActivationBridge as ActivationBridge } from '@rocket.chat/apps-engine/server/bridges/AppActivationBridge';
import { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export class AppActivationBridge extends ActivationBridge {
	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async appAdded(_app: ProxiedApp): Promise<void> {
		// await this.orch.getNotifier().appAdded(app.getID());

		// Calls made via AppActivationBridge should NOT go through
		// View https://github.com/RocketChat/Rocket.Chat/pull/29180 for details
		return undefined;
	}

	protected async appUpdated(_app: ProxiedApp): Promise<void> {
		// Calls made via AppActivationBridge should NOT go through
		// View https://github.com/RocketChat/Rocket.Chat/pull/29180 for details
		// await this.orch.getNotifier().appUpdated(app.getID());
		return undefined;
	}

	protected async appRemoved(app: ProxiedApp): Promise<void> {
		await this.orch.getNotifier().appRemoved(app.getID());
	}

	protected async appStatusChanged(app: ProxiedApp, status: AppStatus): Promise<void> {
		const userStatus = ['auto_enabled', 'manually_enabled'].includes(status) ? UserStatus.ONLINE : UserStatus.OFFLINE;

		await Users.updateStatusByAppId(app.getID(), userStatus);

		await this.orch.getNotifier().appStatusUpdated(app.getID(), status);
	}

	protected async actionsChanged(): Promise<void> {
		await this.orch.getNotifier().actionsChanged();
	}
}
