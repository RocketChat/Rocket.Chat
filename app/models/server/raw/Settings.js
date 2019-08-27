import { BaseRaw } from './BaseRaw';

export class SettingsRaw extends BaseRaw {
	async getValueById(_id) {
		const setting = await this.col.findOne({ _id }, { projection: { value: 1 } });

		return setting.value;
	}
}
