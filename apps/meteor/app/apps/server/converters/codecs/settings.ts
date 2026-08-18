import type { IAppsSetting } from '@rocket.chat/apps';
import type { ISetting } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SettingTypeCodec } from './enums';

/**
 * Rocket.Chat `ISetting` -> Apps-Engine `IAppsSetting`.
 *
 * `decode` reproduces `AppSettingsConverter.convertToApp` (id/date renames + `SettingType` mapping).
 * The setting converter is intentionally one-directional, matching the legacy converter which had no
 * `convertToRocketChat`: an Apps-Engine setting cannot be turned back into a valid `ISetting` (required
 * fields such as `env`, `blocked` and `sorter` are not part of `IAppsSetting`), so `encode` is not
 * supported and throws instead of emitting a lossy, invalid document. Endpoints are typed with
 * `z.custom` so no runtime validation is added on the decode path.
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
	encode: (): ISetting => {
		throw new Error('SettingCodec: converting an Apps-Engine setting back to a Rocket.Chat setting is not supported');
	},
});
