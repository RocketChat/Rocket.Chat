import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { MediaSignalBody, MediaSignalType } from '@rocket.chat/media-signaling';

import { sendSignalToActor } from './sendSignalToActor';

type SendSignalToAllActorsOptions = {
	// default false
	onlyDefinedSessions?: boolean;
	// default true for 'deliver' and 'request', or false for 'notify'
	targetedSignal?: boolean;
};

function getActorData(
	call: IMediaCall,
	role: 'caller' | 'callee',
	options: SendSignalToAllActorsOptions,
): { actor: MediaCallActor; role: 'caller' | 'callee' } | null {
	const { onlyDefinedSessions = false, targetedSignal = true } = options || {};

	const actor = call[role];
	if (actor?.type !== 'user') {
		return null;
	}

	if (!actor.sessionId && onlyDefinedSessions) {
		return null;
	}

	if (!targetedSignal) {
		const { sessionId, ...actorData } = actor;
		return { actor: actorData, role };
	}

	return { actor, role };
}

export async function sendSignalToAllActors<T extends MediaSignalType>(
	call: IMediaCall,
	{ sequence, type, body }: { sequence: number; type: T; body: MediaSignalBody<T> },
	options: SendSignalToAllActorsOptions = {},
): Promise<void> {
	const subOptions: SendSignalToAllActorsOptions = {
		onlyDefinedSessions: options.onlyDefinedSessions ?? false,
		targetedSignal: options.targetedSignal ?? ['deliver', 'request'].includes(type),
	};

	const actors = [getActorData(call, 'caller', subOptions), getActorData(call, 'callee', subOptions)].filter((data) => data) as {
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
