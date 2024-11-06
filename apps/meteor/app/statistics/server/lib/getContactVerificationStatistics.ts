import type { IStats } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

export async function getContactVerificationStatistics(): Promise<IStats['contactVerification']> {
	const [
		totalContacts,
		totalUnknownContacts,
		[{ totalConflicts }],
		totalBlockedContacts,
		totalFullyBlockedContacts,
		totalVerifiedContacts,
		[{ avgChannelsPerContact }],
		totalContactsWithoutChannels,
	] = await Promise.all([
		LivechatContacts.countDocuments({}),
		LivechatContacts.countDocuments({ unknown: true }),
		LivechatContacts.countTotalAmountOfConflicts().toArray(),
		LivechatContacts.countDocuments({ 'channels.blocked': true }),
		LivechatContacts.countDocuments({
			'channels.blocked': true,
			'channels': { $not: { $elemMatch: { $or: [{ blocked: false }, { blocked: { $exists: false } }] } } },
		}),
		LivechatContacts.countDocuments({ unknown: false }),
		LivechatContacts.findAverageAmountOfChannels().toArray(),
		LivechatContacts.countDocuments({ channels: { $in: [undefined, []] } }),
	]);

	return {
		totalContacts,
		totalUnknownContacts,
		totalMergedContacts: settings.get('Merged_Contacts_Count'),
		totalConflicts,
		totalResolvedConflicts: settings.get('Resolved_Conflicts_Count'),
		totalBlockedContacts,
		totalPartiallyBlockedContacts: totalBlockedContacts - totalFullyBlockedContacts,
		totalFullyBlockedContacts,
		totalVerifiedContacts,
		avgChannelsPerContact,
		totalContactsWithoutChannels,
		totalImportedContacts: settings.get('Contacts_Importer_Count'),
		totalUpsellViews: settings.get('Advanced_Contact_Upsell_Views_Count'),
		totalUpsellClicks: settings.get('Advanced_Contact_Upsell_Clicks_Count'),
	};
}
