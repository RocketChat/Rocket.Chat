import type { IInvite } from '@rocket.chat/core-typings';
import { Invites } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export const listInvites = async (userId: string) => {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'listInvites' });
	}

	if (!(await hasPermissionAsync(userId, 'create-invite-links'))) {
		throw new Meteor.Error('not_authorized');
	}

	const invites = await Invites.find({}).toArray();

	// Ensure all invites have inviteToken (for legacy invites that might not have it)
	for (const invite of invites) {
		const inviteWithToken = invite as IInvite & { inviteToken?: string };
		if (!inviteWithToken.inviteToken) {
			const inviteToken = crypto.randomUUID();
			// eslint-disable-next-line no-await-in-loop
			await Invites.updateOne({ _id: invite._id }, { $set: { inviteToken } });
			inviteWithToken.inviteToken = inviteToken;
		}
	}

	// Remove inviteToken from the response
	return invites.map((invite) => {
		const { inviteToken, ...inviteWithoutToken } = invite as IInvite & { inviteToken?: string };
		return inviteWithoutToken;
	});
};
