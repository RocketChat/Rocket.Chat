import { Meteor } from 'meteor/meteor';
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
		Meteor.settings[query._id] = data.value;

		// Can't import before the mock command on end of this file!
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { settings } = require('./settings');
		settings.load(query._id, data.value, !existent);

		this.upsertCalls++;
	}

	updateValueById(id: string, value: any): void {
		this.data.set(id, { ...this.data.get(id), value });

		// Can't import before the mock command on end of this file!
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { settings } = require('./settings');
		Meteor.settings[id] = value;
		settings.load(id, value, false);
	}
}

export const Settings = new SettingsClass();

mock('../../../models/server/models/Settings', Settings);
