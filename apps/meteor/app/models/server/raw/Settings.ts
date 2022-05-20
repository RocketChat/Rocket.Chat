import { Cursor, FilterQuery, UpdateQuery, WriteOpResult } from 'mongodb';
import type { ISetting, ISettingColor, ISettingSelectOption } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class SettingsRaw extends BaseRaw<ISetting> {
	async getValueById(_id: string): Promise<ISetting['value'] | undefined> {
		const setting = await this.findOne<Pick<ISetting, 'value'>>({ _id }, { projection: { value: 1 } });

		return setting?.value;
	}

	findNotHidden({ updatedAfter }: { updatedAfter?: Date } = {}): Cursor<ISetting> {
		const query: FilterQuery<ISetting> = {
			hidden: { $ne: true },
		};

		if (updatedAfter) {
			query._updatedAt = { $gt: updatedAfter };
		}

		return this.find(query);
	}

	findOneNotHiddenById(_id: string): Promise<ISetting | null> {
		const query = {
			_id,
			hidden: { $ne: true },
		};

		return this.findOne(query);
	}

	findByIds(_id: string[] | string = []): Cursor<ISetting> {
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

	updateValueById<T extends ISetting['value'] = ISetting['value']>(_id: string, value: T): Promise<WriteOpResult> {
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

	updateOptionsById<T extends ISetting = ISetting>(_id: ISetting['_id'], options: UpdateQuery<T>['$set']): Promise<WriteOpResult> {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const update = { $set: options };

		return this.update(query, update);
	}

	updateValueNotHiddenById<T extends ISetting['value'] = ISetting['value']>(_id: ISetting['_id'], value: T): Promise<WriteOpResult> {
		const query = {
			_id,
			hidden: { $ne: true },
			blocked: { $ne: true },
		};

		const update = {
			$set: {
				value,
			},
		};

		return this.update(query, update);
	}

	updateValueAndEditorById<T extends ISetting['value'] = ISetting['value']>(
		_id: ISetting['_id'],
		value: T,
		editor: ISettingColor['editor'],
	): Promise<WriteOpResult> {
		const query = {
			blocked: { $ne: true },
			value: { $ne: value },
			_id,
		};

		const update = {
			$set: {
				value,
				editor,
			},
		};

		return this.update(query, update);
	}

	findNotHiddenPublic<T extends ISetting = ISetting>(
		ids: ISetting['_id'][] = [],
	): Cursor<
		T extends ISettingColor
			? Pick<T, '_id' | 'value' | 'editor' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>
			: Pick<T, '_id' | 'value' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>
	> {
		const filter: FilterQuery<ISetting> = {
			hidden: { $ne: true },
			public: true,
		};

		if (ids.length > 0) {
			filter._id = { $in: ids };
		}

		return this.find(filter, {
			projection: {
				_id: 1,
				value: 1,
				editor: 1,
				enterprise: 1,
				invalidValue: 1,
				modules: 1,
				requiredOnWizard: 1,
			},
		});
	}

	findSetupWizardSettings(): Cursor<ISetting> {
		return this.find({ wizard: { $exists: true } });
	}

	addOptionValueById(_id: ISetting['_id'], option: ISettingSelectOption): Promise<WriteOpResult> {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const { key, i18nLabel } = option;
		const update = {
			$addToSet: {
				values: {
					key,
					i18nLabel,
				},
			},
		};

		return this.update(query, update);
	}

	findNotHiddenPublicUpdatedAfter(updatedAt: Date): Cursor<ISetting> {
		const filter = {
			hidden: { $ne: true },
			public: true,
			_updatedAt: {
				$gt: updatedAt,
			},
		};

		return this.find(filter, {
			projection: {
				_id: 1,
				value: 1,
				editor: 1,
				enterprise: 1,
				invalidValue: 1,
				modules: 1,
				requiredOnWizard: 1,
			},
		});
	}
}
