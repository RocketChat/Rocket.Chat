import type { IAppServerOrchestrator } from '@rocket.chat/apps';
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

		if (!(await this.isReadableById(id, appId))) {
			throw new Error(`The setting "${id}" is not readable.`);
		}

		return this.orch.getConverters()?.get('settings').convertById(id);
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
