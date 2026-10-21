import type { IMessage } from '@rocket.chat/core-typings';
import { accessRequirement } from '@rocket.chat/dcs';
import { Messages } from '@rocket.chat/models';

import { policies } from './policies';

/**
 * Stores the access requirement of labeled messages saved without one, so queries can match them for cleared readers.
 * Messages under a policy that isn't loaded keep none and stay unreadable.
 */
export const backfillAccessRequirements = async (): Promise<number> => {
	let updated = 0;
	for await (const { _id, securityLabel } of Messages.findLabeledWithoutAccessRequirement<Pick<IMessage, '_id' | 'securityLabel'>>({
		projection: { securityLabel: 1 },
	})) {
		const policy = securityLabel && policies.find(securityLabel.policyId);
		if (policy) {
			await Messages.setSecurityAccessById(_id, accessRequirement(policy, securityLabel));
			updated++;
		}
	}
	return updated;
};
