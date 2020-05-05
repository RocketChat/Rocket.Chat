import mock from 'mock-require';

type Dictionary = {
	[index: string]: any;
}

class SettingsClass {
	public data = new Map<string, Dictionary>()

	public upsertCalls = 0;

	findOne(query: Dictionary): any {
		return [...this.data.values()].find((data) => Object.entries(query).every(([key, value]) => data[key] === value));
	}

	upsert(query: any, update: any): void {
		const existent = this.findOne(query);

		const data = { ...existent, ...query, ...update.$set };

		if (!existent) {
			Object.assign(data, update.$setOnInsert);
		}

		// console.log(query, data);
		this.data.set(query._id, data);
		this.upsertCalls++;
	}
}

export const Settings = new SettingsClass();

mock('../../../models/server/models/Settings', Settings);
