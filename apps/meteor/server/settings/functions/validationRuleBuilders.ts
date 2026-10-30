import type { ISetting, SettingValidationRule } from '@rocket.chat/core-typings';

export const validCron = (): SettingValidationRule => ({ type: 'cron' });

export const positiveOrDisabled = (): SettingValidationRule => ({
	query: { $or: [{ value: -1 }, { value: { $gte: 1 } }] },
});

export const notGreaterThanSetting = (otherId: ISetting['_id']): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $lte: { $setting: otherId } } }] },
	appliesWhen: { _id: otherId, value: { $gte: 1 } },
});

export const notLowerThanSetting = (otherId: ISetting['_id']): SettingValidationRule => ({
	query: { $or: [{ value: { $lt: 1 } }, { value: { $gte: { $setting: otherId } } }] },
});

export const mustBeDisabledWhileSettingsAreEnabled = (...otherIds: [ISetting['_id'], ...ISetting['_id'][]]): SettingValidationRule => ({
	query: { value: false },
	appliesWhen: otherIds.map((_id) => ({ _id, value: true })),
	referencesMayBeAbsent: true,
});
