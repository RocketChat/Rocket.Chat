import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { settings } from '../../settings';

// Services created before the notice existed never go through addOAuthService again.
export async function addCustomOAuthPremiumAlert(): Promise<void> {
	const query = { _id: /^Accounts_OAuth_Custom-[A-Za-z0-9_]+$/, type: 'boolean' as const };

	await Settings.updateMany(query, { $set: { alert: 'Premium_required_from_9_0_0_alert' } });
	await Settings.find<ISetting>(query).forEach((setting) => settings.set(setting));
}
