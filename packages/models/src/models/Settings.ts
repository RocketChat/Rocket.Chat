import type { ISetting, ISettingColor, ISettingSelectOption, RocketChatRecordDeleted, SettingValue } from '@rocket.chat/core-typings';
import type { ISettingsModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type {
	Collection,
	FindCursor,
	Db,
	Filter,
	UpdateFilter,
	UpdateResult,
	Document,
	FindOneAndUpdateOptions,
	WithId,
	UpdateOptions,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

type PublicSettingFields<T extends ISetting> = T extends ISettingColor
	? Pick<T, '_id' | 'value' | 'editor' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>
	: Pick<T, '_id' | 'value' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>;

export class SettingsRaw extends BaseRaw<ISetting> implements ISettingsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ISetting>>) {
		super(db, 'settings', trash);
	}

	async getValueById<T extends SettingValue = SettingValue>(_id: string): Promise<T | undefined> {
		const setting = await this.findOne<Pick<ISetting, 'value'>>({ _id }, { projection: { value: 1 } });

		return setting?.value as T;
	}

	findNotHidden({ updatedAfter }: { updatedAfter?: Date } = {}): FindCursor<ISetting> {
		const query: Filter<ISetting> = {
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

	findByIds<T extends Document = ISetting, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: string[] | string = [],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		if (typeof _id === 'string') {
			_id = [_id];
		}

		const query = {
			_id: {
				$in: _id,
			},
		};

		return this.find<T, O>(query, options);
	}

	updateValueById(
		_id: string,
		value: (ISetting['value'] extends undefined ? never : ISetting['value']) | null,
		options?: UpdateOptions,
	): Promise<UpdateResult> {
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

		return this.updateOne(query, update, options);
	}

	async resetValueById(
		_id: string,
		value?: (ISetting['value'] extends undefined ? never : ISetting['value']) | null,
	): Promise<Document | UpdateResult | undefined> {
		if (value == null) {
			const record = await this.findOneById(_id);
			if (record) {
				const prop = record.valueSource || 'packageValue';
				value = record[prop];
			}
		}

		if (value == null) {
			return;
		}

		return this.updateValueById(_id, value);
	}

	async incrementValueById(
		_id: ISetting['_id'],
		value?: ISetting['value'],
		options?: FindOneAndUpdateOptions,
	): Promise<null | WithId<ISetting>> {
		return this.findOneAndUpdate(
			{
				blocked: { $ne: true },
				_id,
			},
			{
				$inc: {
					value: value || 1,
				},
			} as unknown as UpdateFilter<ISetting>,
			options,
		);
	}

	updateOptionsById<T extends ISetting = ISetting>(
		_id: ISetting['_id'],
		options: UpdateFilter<T>['$set'],
	): Promise<Document | UpdateResult> {
		const query = {
			blocked: { $ne: true },
			_id,
		};

		const update = { $set: options };

		return this.updateOne(query, update);
	}

	updateValueNotHiddenById<T extends ISetting['value'] = ISetting['value']>(
		_id: ISetting['_id'],
		value: T,
	): Promise<Document | UpdateResult> {
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

		return this.updateOne(query, update);
	}

	updateValueAndEditorById<T extends ISetting['value'] = ISetting['value']>(
		_id: ISetting['_id'],
		value: T,
		editor: ISettingColor['editor'],
	): Promise<Document | UpdateResult> {
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

		return this.updateOne(query, update);
	}

	findNotHiddenPublic<T extends ISetting = ISetting>(ids: ISetting['_id'][] = []): FindCursor<PublicSettingFields<T>> {
		const filter: Filter<ISetting> = {
			hidden: { $ne: true },
			public: true,
		};

		if (ids.length > 0) {
			filter._id = { $in: ids };
		}

		// the projection below matches PublicSettingFields, but TypeScript cannot check that against
		// a conditional type whose input is still a type parameter
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
		}) as unknown as FindCursor<PublicSettingFields<T>>;
	}

	findSetupWizardSettings(): FindCursor<ISetting> {
		return this.find({ wizard: { $exists: true } });
	}

	addOptionValueById(_id: ISetting['_id'], option: ISettingSelectOption): Promise<Document | UpdateResult> {
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

		return this.updateOne(query, update);
	}

	findNotHiddenPublicUpdatedAfter(updatedAt: Date): FindCursor<ISetting> {
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

	findEnterpriseSettings(): FindCursor<ISetting> {
		return this.find({ enterprise: true });
	}
}
