/**
 * The membership-impact preview shape (ABAC-P4 §7.2).
 *
 * Produced by one server-side function and rendered by three surfaces — creation Step 4, the room
 * Edit-channel preview and the admin Edit-room preview — so the shape lives here rather than in
 * either the server or the client.
 */

/** Room-scoped role tags shown beside a member in the preview. */
export type AbacRoomRoleTag = 'owner' | 'moderator' | 'leader';

export type AbacPreviewMember = {
	_id: string;
	username?: string;
	name?: string;
	roles: AbacRoomRoleTag[];
};

export type AbacMembershipPreview = {
	/** Members the attribute set would remove. */
	loses: AbacPreviewMember[];
	/** Members the attribute set would keep. */
	retains: AbacPreviewMember[];
	/**
	 * Members the PDP returned neither a permit nor a deny for. Kept separate from `retains` on
	 * purpose: presenting an unanswered decision as retained access would tell an operator nobody
	 * is affected when the truth is that nothing is known.
	 */
	inconclusive: AbacPreviewMember[];
	/** Exact totals for the whole target, independent of the page returned above. */
	counts: {
		total: number;
		losing: number;
		retaining: number;
		inconclusive: number;
	};
	/** The acting user is among those losing access — warned, not blocked (ABAC-P4/D2). */
	actorLosesAccess: boolean;
	/**
	 * The target is larger than the enumeration threshold, so `counts` are exact but the member
	 * arrays are empty and the surface should summarise rather than list.
	 */
	summarisedOnly: boolean;
	offset: number;
	count: number;
};
