import { settingsRegistry } from '.';
import { mustBeDisabledWhileSettingsAreEnabled } from './functions/validationRuleBuilders';

export const createDiscussionsSettings = () =>
	settingsRegistry.addGroup('Discussion', async function () {
		// the channel for which discussions are created if none is explicitly chosen

		await this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
			// ABAC-P4/D10 — an ABAC-enforcing workspace creates no discussions, so this setting is
			// held at `false` for as long as enforcement lasts and an attempt to turn it back on is
			// refused here rather than silently reconciled by the override. Both gates are named
			// because `ABAC_Enforce_All_Rooms` keeps its stored value while `ABAC_Enabled` is off,
			// and enforcement is the two of them together. Neither exists in CE, where the rule is
			// inert.
			validation: [mustBeDisabledWhileSettingsAreEnabled('ABAC_Enabled', 'ABAC_Enforce_All_Rooms')],
		});
	});
