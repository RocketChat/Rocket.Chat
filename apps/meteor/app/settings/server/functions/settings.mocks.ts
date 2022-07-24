import mock from 'mock-require';
import type { ISetting } from '@rocket.chat/core-typings';

import { ICachedSettings } from '../CachedSettings';

type Dictionary = {
	[index: string]: any;
};

class SettingsClass {
	settings: ICachedSettings;

	find(): any[] {
		return [];
	}

	public data = new Map<string, Dictionary>();

	public upsertCalls = 0;

	public insertCalls = 0;

	private checkQueryMatch(key: string, data: Dictionary, queryValue: any): boolean {
		if (typeof queryValue === 'object') {
			if (queryValue.$exists !== undefined) {
				return (data.hasOwnProperty(key) && data[key] !== undefined) === queryValue.$exists;
			}
		}

		return queryValue === data[key];
	}

	findOne(query: Dictionary): any {
		return [...this.data.values()].find((data) => Object.entries(query).every(([key, value]) => this.checkQueryMatch(key, data, value)));
	}

	insert(doc: any): void {
		this.data.set(doc._id, doc);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		this.settings.set(doc);
		this.insertCalls++;
	}

	upsert(query: any, update: any): void {
		const existent = this.findOne(query);

		const data = { ...existent, ...query, ...update, ...update.$set };

		if (!existent) {
			Object.assign(data, update.$setOnInsert);
		}

		// console.log(query, data);
		this.data.set(query._id, data);

		// Can't import before the mock command on end of this file!
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		this.settings.set(data);

		this.upsertCalls++;
	}

	updateValueById(id: string, value: any): void {
		this.data.set(id, { ...this.data.get(id), value });

		// Can't import before the mock command on end of this file!
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		this.settings.set(this.data.get(id) as ISetting);
	}
}

export const Settings = new SettingsClass();

mock('../../../models/server/models/Settings', Settings);
