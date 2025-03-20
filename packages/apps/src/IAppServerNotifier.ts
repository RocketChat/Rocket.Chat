import type { AppStatus, IAppsSetting } from './AppsEngine';

export interface IAppServerNotifier {
	appAdded(appId: string): Promise<void>;
	appRemoved(appId: string): Promise<void>;
	appUpdated(appId: string): Promise<void>;
	appStatusUpdated(appId: string, status: AppStatus): Promise<void>;
	appSettingsChange(appId: string, setting: IAppsSetting): Promise<void>;
	commandAdded(command: string): Promise<void>;
	commandDisabled(command: string): Promise<void>;
	commandUpdated(command: string): Promise<void>;
	commandRemoved(command: string): Promise<void>;
	actionsChanged(): Promise<void>;
}
