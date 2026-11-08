import type { IRoom, IUser, VideoConferenceChatAccess } from '@rocket.chat/core-typings';

/** Being in a call and being able to read its chat are separate questions. */
export const hasConferenceChatAccess = (
	access: Pick<VideoConferenceChatAccess, 'membersWithoutAccess'> | undefined,
	uid: IUser['_id'] | null | undefined,
): boolean => !uid || !access?.membersWithoutAccess.includes(uid);

/** Which remedy leads — is offered as the primary action — rather than which one is allowed. */
export const chatAccessLeadsWithDiscussion = ({ canInvite, type }: { canInvite: boolean; type: IRoom['t'] }): boolean =>
	!canInvite || type === 'p' || type === 'd';
