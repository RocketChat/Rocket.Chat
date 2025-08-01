import type { AtLeast, IMediaCallChannel, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

export async function createInitialChannel(
	callId: string,
	actor: MediaCallActor,
	channelData: AtLeast<InsertionModel<IMediaCallChannel>, 'role'>,
	userData?: Pick<IUser, '_id' | 'name' | 'username'>,
): Promise<void> {
	// Rocket.Chat users will have a separate channel entry for each session involved in the call
	// So if we don't have the sessionId of an user yet, do not initialize the channel
	if (actor.type !== 'user' || !actor.sessionId) {
		return;
	}

	if (!userData?.username || !userData.name) {
		return;
	}

	await MediaCallChannels.insertOne({
		...channelData,
		callId,
		participant: {
			type: 'user',
			id: userData._id,
			username: userData.username,
			displayName: userData.name,
			sessionId: actor.sessionId,
		},
		state: 'none',
		joinedAt: new Date(),
		acknowledged: false,
	});
}
