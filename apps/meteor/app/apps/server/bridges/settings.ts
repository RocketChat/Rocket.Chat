import { Apps, type IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IReadSettingPermission } from '@rocket.chat/apps-engine/definition/permissions/IPermission';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { ServerSettingBridge } from '@rocket.chat/apps-engine/server/bridges/ServerSettingBridge';
import { Settings } from '@rocket.chat/models';

import { updateAuditedByApp } from '../../../../server/settings/lib/auditedSettingUpdates';
import { notifyOnSettingChanged, notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';

export class AppSettingBridge extends ServerSettingBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async getAll(appId: string): Promise<Array<ISetting>> {
		this.orch.debugLog(`The App ${appId} is getting all the settings.`);

		const settings = await Settings.find({ secret: false }).toArray();
		return settings.map((s) => this.orch.getConverters()?.get('settings').convertToApp(s));
	}

	protected async getOneById(id: string, appId: string): Promise<ISetting> {
		this.orch.debugLog(`The App ${appId} is getting the setting by id ${id}.`);

		const setting = await this.getReadableSettingById(id, appId);
		if (!setting) {
			throw new Error(`The setting "${id}" is not readable.`);
		}

		return setting;
	}

	protected async hideGroup(name: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is hidding the group ${name}.`);

		throw new Error('Method not implemented.');
	}

	protected async hideSetting(id: string, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is hidding the setting ${id}.`);

		if (!(await this.isReadableById(id, appId))) {
			throw new Error(`The setting "${id}" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}

	protected async isReadableById(id: string, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is checking if they can read the setting ${id}.`);
		const setting = await Settings.findOneById(id);
		return Boolean(setting && !setting.secret);
	}

	protected async getReadableSettingById(id: string, appId: string): Promise<ISetting | null> {
		this.orch.debugLog(`The app ${appId} is checking if it can read the setting ${id}`);
		const app = Apps.self?.getManager().getOneById(appId);
		if (!app) {
			this.orch.debugLog(`The app ${appId} is not found.`);
			return null;
		}

		const { permissions } = app.getInfo();

		// If the app does not have any permissions we must assume it has a set of default permissions
		// so, for being cautious, we will not allow it to read all settings.
		// If one desires to read a hidden setting it must ask explicitly for it.
		if (!permissions) {
			const setting = await Settings.findOneNotHiddenById(id);
			if (!setting) {
				this.orch.debugLog(`The setting ${id} is not found.`);
				return null;
			}

			return this.orch.getConverters()?.get('settings').convertToApp(setting);
		}

		const readSettingsPermission = permissions.find((perm) => perm.name === 'server-setting.read');
		if (!readSettingsPermission) {
			this.orch.debugLog(`The app ${appId} has no server-setting.read permission.`);
			return null;
		}

		const readSettings = readSettingsPermission as IReadSettingPermission;
		// If the setting is in the hiddenSettings list (defined within the permission), then it can bypass the hidden flag.
		// If not, then it must be a non-hidden setting. This is to allow apps to read hidden settings if they have the permission to do so.
		const setting = readSettings.hiddenSettings?.includes(id) ? await Settings.findOneById(id) : await Settings.findOneNotHiddenById(id);

		if (!setting) {
			this.orch.debugLog(`The setting ${id} is not found.`);
			return null;
		}

		return this.orch.getConverters()?.get('settings').convertToApp(setting);
	}

	protected async updateOne(setting: ISetting & { id: string }, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is updating the setting ${setting.id} .`);

		if (!(await this.isReadableById(setting.id, appId))) {
			throw new Error(`The setting "${setting.id}" is not readable.`);
		}

		if (
			(
				await updateAuditedByApp({
					_id: appId,
				})(Settings.updateValueById, setting.id, setting.value)
			).modifiedCount
		) {
			void notifyOnSettingChangedById(setting.id);
		}
	}

	protected async incrementValue(id: string, value: number, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is incrementing the value of the setting ${id}.`);

		if (!(await this.isReadableById(id, appId))) {
			throw new Error(`The setting "${id}" is not readable.`);
		}

		const setting = await Settings.incrementValueById(id, value, { returnDocument: 'after' });
		if (setting) {
			void notifyOnSettingChanged(setting);
		}
	}
}
