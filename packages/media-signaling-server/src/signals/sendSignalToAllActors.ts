import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignalBody, MediaSignalType } from '@rocket.chat/media-signaling';

import { sendSignalToActor } from './sendSignalToActor';

function getActorData(
	call: IMediaCall,
	role: 'caller' | 'callee',
	options: { onlyDefinedSessions?: boolean },
): { actor: MediaCallActor; role: 'caller' | 'callee' } | null {
	const { onlyDefinedSessions = false } = options || {};

	const actor = call[role];
	if (actor?.type !== 'user') {
		return null;
	}

	if (!actor.sessionId && onlyDefinedSessions) {
		return null;
	}

	return { actor, role };
}

export async function sendSignalToAllActors<T extends MediaSignalType>(
	call: IMediaCall,
	{ sequence, type, body }: { sequence: number; type: T; body: MediaSignalBody<T> },
	options: { onlyDefinedSessions?: boolean },
): Promise<void> {
	const actors = [getActorData(call, 'caller', options), getActorData(call, 'callee', options)].filter((data) => data) as {
		actor: MediaCallActor;
		role: 'caller' | 'callee';
	}[];

	await Promise.all(
		actors.map(async ({ actor, role }) =>
			sendSignalToActor(actor, {
				callId: call._id,
				role,
				sequence,
				type,
				body,
			}),
		),
	);
}
