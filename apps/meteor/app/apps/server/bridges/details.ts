import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { AppDetailChangesBridge as DetailChangesBridge } from '@rocket.chat/apps-engine/server/bridges/AppDetailChangesBridge';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('Apps:Details');

export class AppDetailChangesBridge extends DetailChangesBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected onAppSettingsChange(appId: string, setting: ISetting): void {
		const logFailure = () => logger.warn('failed to notify about the setting change.', appId);

		try {
			this.orch.getNotifier().appSettingsChange(appId, setting).catch(logFailure);
		} catch (e) {
			logFailure();
		}
	}
}
