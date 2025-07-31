import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole, MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';

import { sendSignalToActor } from './sendSignalToActor';

type SendSignalToAllActorsOptions = {
	// default false
	onlyDefinedSessions?: boolean;
	// default false
	targetedSignal?: boolean;
};

function getActorData(call: IMediaCall, role: CallRole, options: SendSignalToAllActorsOptions): MediaCallActor | null {
	const { onlyDefinedSessions = false, targetedSignal = false } = options || {};

	const actor = call[role];
	if (actor?.type !== 'user') {
		return null;
	}

	if (!actor.sessionId && onlyDefinedSessions) {
		return null;
	}

	if (!targetedSignal) {
		const { sessionId, ...actorData } = actor;
		return actorData;
	}

	return actor;
}

export async function getAllActors(call: IMediaCall, options: SendSignalToAllActorsOptions = {}): Promise<MediaCallActor[]> {
	const subOptions: SendSignalToAllActorsOptions = {
		onlyDefinedSessions: options.onlyDefinedSessions ?? false,
		targetedSignal: options.targetedSignal ?? false,
	};

	return [getActorData(call, 'caller', subOptions), getActorData(call, 'callee', subOptions)].filter((data) => data) as MediaCallActor[];
}

export async function sendSignalToAllActors<T extends MediaSignalType>(
	call: IMediaCall,
	signal: MediaSignalBodyAndType<T>,
	options: SendSignalToAllActorsOptions = {},
): Promise<void> {
	const actors = await getAllActors(call, options);

	await Promise.all(
		actors.map(async (actor) =>
			sendSignalToActor(actor, {
				callId: call._id,
				...signal,
			}),
		),
	);
}
