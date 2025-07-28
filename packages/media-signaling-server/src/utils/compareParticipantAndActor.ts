import type { MediaCallActor, MediaCallChannelUserRC, MediaCallParticipant } from '@rocket.chat/core-typings';

export function compareParticipantAndActor(participant: MediaCallParticipant, actor: MediaCallActor): boolean {
	if (participant.type !== actor.type || participant.id !== actor.id) {
		return false;
	}

	if (actor.type === 'user') {
		const user = participant as MediaCallChannelUserRC;

		return !actor.sessionId || actor.sessionId === user.sessionId;
	}

	return true;
}
