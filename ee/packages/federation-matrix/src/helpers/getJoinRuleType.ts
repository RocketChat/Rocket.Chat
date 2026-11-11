import type { PduForType } from '@rocket.chat/federation-sdk';

// get the join rule type from the stripped state stored in the unsigned section of the event
// as per the spec, we must support several types but we only support invite and public for now.
// in the future, we must start looking into 'knock', 'knock_restricted', 'restricted' and 'private'.
export function getJoinRuleType(strippedState: PduForType[] | undefined): 'p' | 'c' | 'd' {
	const joinRule = strippedState?.find((state) => state.type === 'm.room.join_rules')?.content?.join_rule;

	// as per the spec, users need to be invited to join a room, unless the room’s join rules state otherwise.
	if (joinRule === undefined) {
		return 'p';
	}

	switch (joinRule) {
		case 'invite':
			return 'p';
		case 'public':
			return 'c';
		case 'knock':
			throw new Error(`Knock join rule is not supported`);
		case 'knock_restricted':
			throw new Error(`Knock restricted join rule is not supported`);
		case 'restricted':
			throw new Error(`Restricted join rule is not supported`);
		case 'private':
			throw new Error(`Private join rule is not supported`);
		default:
			throw new Error(`Unknown join rule type: ${String(joinRule)}`);
	}
}
