import type { ISetting, SettingValidationRule } from '@rocket.chat/core-typings';

export const integerBoundOrDisabled = (): SettingValidationRule => ({
	query: { $or: [{ value: -1 }, { value: { $gte: 1 } }] },
});

export const notAboveSetting = (otherId: ISetting['_id']): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $lte: { $setting: otherId } } }] },
	appliesWhen: { _id: otherId, value: { $gte: 1 } },
});

export const notBelowSetting = (otherId: ISetting['_id']): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $gte: { $setting: otherId } } }] },
});
