import type { ISetting, SettingValidationRule } from '@rocket.chat/core-typings';

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

/**
 * The setting may only be saved as `false` while `otherId` is `true`.
 *
 * Safe across editions: `validateSettingRules` treats a rule referencing a setting that does not
 * exist as passing, so a rule pointing at an enterprise-only setting is inert in CE.
 */
export const mustBeDisabledWhileSettingIsEnabled = (otherId: ISetting['_id']): SettingValidationRule => ({
	query: { value: false },
	appliesWhen: { _id: otherId, value: true },
});
