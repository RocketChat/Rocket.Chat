import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting as AppsSetting } from '@rocket.chat/apps-engine/definition/settings';
import { api } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';

export class AppServerNotifier {
	async appAdded(appId: string): Promise<void> {
		void api.broadcast('apps.added', appId);
	}

	async appRemoved(appId: string): Promise<void> {
		void api.broadcast('apps.removed', appId);
	}

	async appUpdated(appId: string): Promise<void> {
		void api.broadcast('apps.updated', appId, InstanceStatus.id());
	}

	async appStatusUpdated(appId: string, status: AppStatus): Promise<void> {
		void api.broadcast('apps.statusUpdate', appId, status);
	}

	async appSettingsChange(appId: string, setting: AppsSetting): Promise<void> {
		void api.broadcast('apps.settingUpdated', appId, setting);
	}

	async commandAdded(command: string): Promise<void> {
		void api.broadcast('command.added', command);
	}

	async commandDisabled(command: string): Promise<void> {
		void api.broadcast('command.disabled', command);
	}

	async commandUpdated(command: string): Promise<void> {
		void api.broadcast('command.updated', command);
	}

	async commandRemoved(command: string): Promise<void> {
		void api.broadcast('command.removed', command);
	}

	async actionsChanged(): Promise<void> {
		void api.broadcast('actions.changed');
	}
}
