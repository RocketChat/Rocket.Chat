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
 * The setting may only be saved as `false` while every one of `otherIds` is `true`. The tuple type
 * rules out the empty call, which would otherwise build a rule that refuses `true` unconditionally.
 *
 * Safe across editions: `validateSettingRules` treats a rule referencing a setting that does not
 * exist as passing, so a rule naming an enterprise-only setting is inert in CE. `referencesMayBeAbsent`
 * is what keeps it quiet there too, since gating across editions is the reason this builder exists.
 */
export const mustBeDisabledWhileSettingsAreEnabled = (...otherIds: [ISetting['_id'], ...ISetting['_id'][]]): SettingValidationRule => ({
	query: { value: false },
	appliesWhen: otherIds.map((_id) => ({ _id, value: true })),
	referencesMayBeAbsent: true,
});
