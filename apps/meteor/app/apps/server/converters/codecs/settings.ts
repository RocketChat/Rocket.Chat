import type { IAppsSetting } from '@rocket.chat/apps';
import type { ISetting } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SettingTypeCodec } from './enums';

/**
 * Rocket.Chat `ISetting` <-> Apps-Engine `IAppsSetting`.
 *
 * `decode` reproduces `AppSettingsConverter.convertToApp` (id/date renames + `SettingType` mapping);
 * `encode` is the inverse. Endpoints are typed with `z.custom` so no runtime validation is added yet.
 */
export const SettingCodec = z.codec(z.custom<ISetting>(), z.custom<IAppsSetting>(), {
	decode: (setting): IAppsSetting =>
		({
			id: setting._id,
			type: z.decode(SettingTypeCodec, setting.type),
			packageValue: setting.packageValue,
			values: setting.values,
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			group: setting.group,
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			createdAt: setting.ts,
			updatedAt: setting._updatedAt,
		}) as unknown as IAppsSetting,
	encode: (setting): ISetting =>
		({
			_id: setting.id,
			type: z.encode(SettingTypeCodec, setting.type),
			packageValue: setting.packageValue,
			values: setting.values,
			value: setting.value,
			public: setting.public,
			hidden: setting.hidden,
			group: (setting as { group?: string }).group,
			i18nLabel: setting.i18nLabel,
			i18nDescription: setting.i18nDescription,
			ts: setting.createdAt,
			_updatedAt: setting.updatedAt,
		}) as unknown as ISetting,
});
