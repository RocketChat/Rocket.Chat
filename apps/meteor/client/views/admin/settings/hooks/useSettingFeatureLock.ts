import type { ISetting } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

import { useIsAbacEnforcementOn } from '../../ABAC/hooks/useIsAbacEnforcementOn';

export type SettingFeatureLock = {
	/** The setting cannot be edited while the feature holding it is active. */
	locked: boolean;
	/** Explains which feature is holding the setting and how to release it. */
	hintKey?: TranslationKey;
};

const NOT_LOCKED: SettingFeatureLock = { locked: false };

/**
 * Some settings are held at a fixed value by another feature rather than by their own
 * `enableQuery`. This reports that, so the admin field renders disabled with an explanation
 * instead of looking writable and failing on save.
 *
 * It exists because `enableQuery` cannot express these cases safely: a query referencing an
 * enterprise-only setting id evaluates to `false` on a workspace where that setting was never
 * registered, which would disable the field permanently in CE (`performSettingQuery` requires the
 * referenced setting to exist). Reading the value through a hook is edition-safe — an absent
 * setting simply reads as its default.
 *
 * Each entry must also be enforced server-side; this is presentation only.
 */
export const useSettingFeatureLock = (settingId: ISetting['_id']): SettingFeatureLock => {
	const abacEnforcementOn = useIsAbacEnforcementOn();

	// ABAC-P4/D10 — enforcement holds `Discussion_enabled` at false workspace-wide and refuses
	// writes to it. Enforced by the `validation` rule on the setting's own definition.
	if (settingId === 'Discussion_enabled' && abacEnforcementOn) {
		return { locked: true, hintKey: 'ABAC_Discussion_disabled_by_enforcement' };
	}

	return NOT_LOCKED;
};
