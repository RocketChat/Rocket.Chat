import type { ISetting, SettingValidationRule } from '@rocket.chat/core-typings';

export const integerBoundOrDisabled = (errorKey: string): SettingValidationRule => ({
	query: { $or: [{ value: -1 }, { value: { $gte: 1 } }] },
	errorKey,
});

export const notAboveSetting = (otherId: ISetting['_id'], errorKey: string): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $lte: { $setting: otherId } } }] },
	appliesWhen: { _id: otherId, value: { $gte: 1 } },
	errorKey,
});

export const notBelowSetting = (otherId: ISetting['_id'], errorKey: string): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $gte: { $setting: otherId } } }] },
	errorKey,
});
