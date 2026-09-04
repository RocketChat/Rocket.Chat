import { settingsRegistry } from '.';
import { mustBeDisabledWhileSettingIsEnabled } from './functions/validationRuleBuilders';

export const createDiscussionsSettings = () =>
	settingsRegistry.addGroup('Discussion', async function () {
		// the channel for which discussions are created if none is explicitly chosen

		await this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
			// ABAC-P4/D10 — while ABAC enforcement is on, discussion creation is blocked workspace-wide
			// and this setting is held at `false`; an attempt to turn it back on is rejected rather than
			// silently reconciled. `ABAC_Enforce_All_Rooms` is enterprise-only and does not exist in CE,
			// where this rule is inert.
			validation: [mustBeDisabledWhileSettingIsEnabled('ABAC_Enforce_All_Rooms')],
		});
	});
