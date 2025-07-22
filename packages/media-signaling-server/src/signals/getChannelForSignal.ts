import type { AtLeast, IMediaCall, IMediaCallChannel, IUser, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

import { getRoleForActor } from '../channels/getRoleForActor';

type ValidUser = AtLeast<Required<IUser>, '_id' | 'username' | 'name'>;

export async function getChannelForSignal(signal: MediaSignal, call: IMediaCall, user: ValidUser): Promise<ValidSignalChannel> {
	const actor = { type: 'user', id: user._id, sessionId: signal.sessionId } as const;

	// Every time the server receives any signal, we need to check if the client that sent it is already in the call's channel list
	const existingChannel = await MediaCallChannels.findOneByCallIdAndParticipant(call._id, actor);

	if (existingChannel) {
		return existingChannel as ValidSignalChannel;
	}

	const role = getRoleForActor(call, actor);

	const newChannel: InsertionModel<IMediaCallChannel> = {
		callId: call._id,
		participant: {
			...actor,
			username: user.username,
			displayName: user.name,
		},
		role,
		state: 'none',
	};

	try {
		await MediaCallChannels.insertOne(newChannel);
	} catch (e) {
		// #ToDo: Check if it was really a race condition?
	}

	const insertedChannel = await MediaCallChannels.findOneByCallIdAndParticipant(call._id, actor);
	if (!insertedChannel) {
		throw new Error('failed-to-insert-channel');
	}

	return insertedChannel as ValidSignalChannel;
}
