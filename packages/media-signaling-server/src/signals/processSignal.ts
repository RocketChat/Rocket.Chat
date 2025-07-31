import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal, MediaSignalAnswer, MediaSignalHangup, MediaSignalSDP } from '@rocket.chat/media-signaling';
import { MediaCalls, Users } from '@rocket.chat/models';

import { getChannelForSignal } from './getChannelForSignal';
import { processAnswer } from './processAnswer';
import { processHangup } from './processHangup';
import { processSDP } from './processSDP';
import { getRoleForActor } from '../channels/getRoleForActor';
import { assertSignalHasSessionId } from '../utils/assertSignalHasSessionId';
import { compareParticipantAndActor } from '../utils/compareParticipantAndActor';

export async function processSignal(signal: MediaSignal, uid: IUser['_id']): Promise<void> {
	assertSignalHasSessionId(signal);
	console.log('server.processSignal', signal, uid);

	try {
		const call = await MediaCalls.findOneById(signal.callId);
		if (!call) {
			throw new Error('invalid-call');
		}

		const user = await Users.findOneById<Pick<Required<IUser>, '_id' | 'username' | 'name'>>(uid, { projection: { username: 1, name: 1 } });
		if (!user?.username || !user?.name) {
			throw new Error('invalid-user');
		}

		const actor = { type: 'user', id: user._id, sessionId: signal.sessionId } as const;
		const role = getRoleForActor(call, actor);
		if (!role) {
			throw new Error('invalid-role');
		}

		const channel = await getChannelForSignal({
			callId: call._id,
			participant: {
				...actor,
				username: user.username,
				displayName: user.name,
			},
			role,
		});

		// This shouldn't be possible unless something tried to switch the roles of the call's actors
		if (channel.role !== role || !compareParticipantAndActor(channel.participant, call[channel.role])) {
			throw new Error('invalid-channel-data');
		}

		switch (signal.type) {
			case 'sdp':
				await processSDP(signal.body as MediaSignalSDP, call, channel);
				break;
			case 'error':
				// #ToDo
				break;
			case 'answer':
				await processAnswer(signal.body as MediaSignalAnswer, call, channel);
				break;
			case 'hangup':
				await processHangup(signal.body as MediaSignalHangup, call, channel);
				break;
		}
	} catch (e) {
		console.log(e);
		throw e;
	}
}
