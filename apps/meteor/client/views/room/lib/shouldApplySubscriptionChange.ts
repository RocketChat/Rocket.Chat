/**
 * Whether a subscription change is one to apply here: this room's, and not its removal — a removed subscription
 * is the room going away from under them, not an update to fold in.
 */
export const shouldApplySubscriptionChange = (event: string, subRid: string | undefined, rid: string): boolean =>
	event !== 'removed' && subRid === rid;
