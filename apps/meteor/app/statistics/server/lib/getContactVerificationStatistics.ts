import type { IStats } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

export async function getContactVerificationStatistics(): Promise<IStats['contactVerification']> {
	const [
		totalContacts,
		totalUnknownContacts,
		[{ totalConflicts, avgChannelsPerContact } = { totalConflicts: 0, avgChannelsPerContact: 0 }],
		totalBlockedContacts,
		totalFullyBlockedContacts,
		totalVerifiedContacts,
		totalContactsWithoutChannels,
	] = await Promise.all([
		LivechatContacts.estimatedDocumentCount(),
		LivechatContacts.countUnknown(),
		LivechatContacts.getStatistics().toArray(),
		LivechatContacts.countBlocked(),
		LivechatContacts.countFullyBlocked(),
		LivechatContacts.countVerified(),
		LivechatContacts.countContactsWithoutChannels(),
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
