import type { IRoom, IUser, VideoConferenceChatAccess, VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';

/**
 * Whether this user can read the conference's chat. Membership of a call grants no room access, so being in a
 * call and being able to follow what is said in it are separate questions.
 *
 * Asked in three places — whether to render the chat at all, whether to offer to share it, and how to mark a
 * member in the list — and each had worked it out for itself, from either an array or a `Set`.
 */
export const hasConferenceChatAccess = (
	access: Pick<VideoConferenceChatAccess, 'membersWithoutAccess'> | undefined,
	uid: IUser['_id'] | null | undefined,
): boolean => !uid || !access?.membersWithoutAccess.includes(uid);

/**
 * Which way of giving the missing members access should lead — be the primary action offered.
 *
 * Both give something away: inviting exposes the room's whole history to someone outside it, while moving the
 * chat to a discussion leaves the earlier history behind for everyone already there. Exposing a *private*
 * room's history is the bigger step, so private rooms and DMs lead with the discussion and public rooms —
 * whose history is already open — lead with the invite. A room that can't take new members at all leaves the
 * discussion as the only option.
 */
export const chatAccessLeadsWithDiscussion = ({ canInvite, type }: { canInvite: boolean; type: IRoom['t'] }): boolean =>
	!canInvite || type === 'p' || type === 'd';

/**
 * The mode to act on, given what the caller asked for and what the room allows.
 *
 * The caller always asks for one: which way leads is shown to whoever is choosing (see
 * `chatAccessLeadsWithDiscussion`), so there is nothing left for this to infer. Returns `null` when the room
 * can't do what was asked, which is a refusal rather than a reason to silently do the other thing — that would
 * give away history nobody agreed to give away.
 */
export const resolveChatAccessMode = ({
	mode,
	canInvite,
}: {
	mode: VideoConferenceChatAccessMode;
	canInvite: boolean;
}): VideoConferenceChatAccessMode | null => (mode === 'invite' && !canInvite ? null : mode);
