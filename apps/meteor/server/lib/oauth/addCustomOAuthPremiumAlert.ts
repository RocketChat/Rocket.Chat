import { Settings } from '@rocket.chat/models';

// Services created before the notice existed never go through addOAuthService again.
export async function addCustomOAuthPremiumAlert(): Promise<void> {
	await Settings.updateMany(
		{ _id: /^Accounts_OAuth_Custom-[A-Za-z0-9_]+$/, type: 'boolean' as const },
		{ $set: { alert: 'Premium_required_from_9_0_0_alert' } },
	);
}
