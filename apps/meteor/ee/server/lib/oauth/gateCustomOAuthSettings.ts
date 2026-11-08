import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { settings } from '../../../../server/settings';

// Services created before the gate existed never go through addOAuthService again.
export async function gateCustomOAuthSettings(): Promise<void> {
	const query = { _id: /^Accounts_OAuth_Custom-[A-Za-z0-9_]+$/, type: 'boolean' as const };

	await Settings.updateMany(query, {
		$set: { enterprise: true, modules: ['oauth-enterprise'], invalidValue: false },
		$unset: { alert: 1 },
	});
	await Settings.find<ISetting>(query).forEach((setting) => settings.set(setting));
}
