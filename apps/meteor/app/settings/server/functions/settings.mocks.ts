import type { ISetting } from '@rocket.chat/core-typings';

import type { ICachedSettings } from '../CachedSettings';

type Dictionary = {
	[index: string]: any;
};

class SettingsClass {
	settings: ICachedSettings;

	private delay = 0;

	setDelay(delay: number): void {
		this.delay = delay;
	}

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

	insertOne(doc: any): void {
		this.data.set(doc._id, doc);
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		this.settings.set(doc);
		this.insertCalls++;
	}

	updateOne(query: any, update: any, options?: any): void {
		const existent = this.findOne(query);

		const data = { ...existent, ...query, ...update, ...update.$set };

		if (!existent) {
			Object.assign(data, update.$setOnInsert);
		}

		if (update.$unset) {
			Object.keys(update.$unset).forEach((key) => {
				delete data[key];
			});
		}

		const modifiers = ['$set', '$setOnInsert', '$unset'];

		modifiers.forEach((key) => {
			delete data[key];
		});

		if (options?.upsert === true && !modifiers.some((key) => Object.keys(update).includes(key))) {
			throw new Error('Invalid upsert');
		}

		if (this.delay) {
			setTimeout(() => {
				// console.log(query, data);
				this.data.set(query._id, data);

				// Can't import before the mock command on end of this file!
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				this.settings.set(data);
			}, this.delay);
		} else {
			this.data.set(query._id, data);
			// Can't import before the mock command on end of this file!
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			this.settings.set(data);
		}

		this.upsertCalls++;
	}

	findOneAndUpdate({ _id }: { _id: string }, value: any, options?: any) {
		this.updateOne({ _id }, value, options);
		return { value: this.findOne({ _id }) };
	}

	updateValueById(id: string, value: any): void {
		this.data.set(id, { ...this.data.get(id), value });
		// Can't import before the mock command on end of this file!
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		if (this.delay) {
			setTimeout(() => {
				this.settings.set(this.data.get(id) as ISetting);
			}, this.delay);
		} else {
			this.settings.set(this.data.get(id) as ISetting);
		}
	}
}

export const Settings = new SettingsClass();
