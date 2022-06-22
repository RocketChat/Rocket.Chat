import type { Cursor, UpdateQuery, WriteOpResult } from 'mongodb';
import type { ISetting, ISettingColor, ISettingSelectOption } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISettingsModel extends IBaseModel<ISetting> {
	getValueById(_id: string): Promise<ISetting['value'] | undefined>;

	findNotHidden(params?: { updatedAfter?: Date }): Cursor<ISetting>;

	findOneNotHiddenById(_id: string): Promise<ISetting | null>;

	findByIds(_id?: string[] | string): Cursor<ISetting>;

	updateValueById<T extends ISetting['value'] = ISetting['value']>(_id: string, value: T): Promise<WriteOpResult>;

	updateOptionsById<T extends ISetting = ISetting>(_id: ISetting['_id'], options: UpdateQuery<T>['$set']): Promise<WriteOpResult>;

	updateValueNotHiddenById<T extends ISetting['value'] = ISetting['value']>(_id: ISetting['_id'], value: T): Promise<WriteOpResult>;

	updateValueAndEditorById<T extends ISetting['value'] = ISetting['value']>(
		_id: ISetting['_id'],
		value: T,
		editor: ISettingColor['editor'],
	): Promise<WriteOpResult>;

	findNotHiddenPublic<T extends ISetting = ISetting>(
		ids?: ISetting['_id'][],
	): Cursor<
		T extends ISettingColor
			? Pick<T, '_id' | 'value' | 'editor' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>
			: Pick<T, '_id' | 'value' | 'enterprise' | 'invalidValue' | 'modules' | 'requiredOnWizard'>
	>;

	findSetupWizardSettings(): Cursor<ISetting>;

	addOptionValueById(_id: ISetting['_id'], option: ISettingSelectOption): Promise<WriteOpResult>;

	findNotHiddenPublicUpdatedAfter(updatedAt: Date): Cursor<ISetting>;
}
