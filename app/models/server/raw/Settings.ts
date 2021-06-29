import { Cursor, WriteOpResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ISetting } from '../../../../definition/ISetting';

type T = ISetting;

export class SettingsRaw extends BaseRaw<T> {
	async getValueById(_id: string): Promise<ISetting['value'] | undefined> {
		const setting = await this.findOne<Pick<ISetting, 'value'>>({ _id }, { projection: { value: 1 } });

		return setting?.value;
	}

	findOneNotHiddenById(_id: string): Promise<T | null> {
		const query = {
			_id,
			hidden: { $ne: true },
		};

		return this.findOne(query);
	}

	findByIds(_id: string[] | string = []): Cursor<T> {
		if (typeof _id === 'string') {
			_id = [_id];
		}

		const query = {
			_id: {
				$in: _id,
			},
		};

		return this.find(query);
	}

	updateValueById(_id: string, value: any): Promise<WriteOpResult> {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id,
		};

		const update = {
			$set: {
				value,
			},
		};

		return this.update(query, update);
	}
}
