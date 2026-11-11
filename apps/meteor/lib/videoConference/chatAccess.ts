import type { VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';

/**
 * The mode to act on, or `null` when the room cannot do what was asked.
 *
 * `null` is a refusal, not a cue to do the other thing — silently inviting instead would hand out history
 * nobody agreed to hand out.
 */
export const resolveChatAccessMode = ({
	mode,
	canInvite,
}: {
	mode: VideoConferenceChatAccessMode;
	canInvite: boolean;
}): VideoConferenceChatAccessMode | null => (mode === 'invite' && !canInvite ? null : mode);
