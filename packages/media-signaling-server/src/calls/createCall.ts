import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import { MediaCalls, Users } from '@rocket.chat/models';

import { createInitialChannel } from '../channels/createInitialChannel';

export async function createCall(caller: MediaCallActor, callee: MediaCallActor): Promise<void> {
	if (caller.type !== 'user' || callee.type !== 'user') {
		throw new Error('not-implemented');
	}
	if (!caller.sessionId) {
		throw new Error('not-implemented');
	}

	const callerUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(caller.id, {
		projection: { username: 1, name: 1 },
	});

	if (!callerUser?.username) {
		throw new Error('invalid-caller');
	}

	const calleeUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name'>>(callee.id, {
		projection: { username: 1, name: 1 },
	});
	if (!calleeUser?.username) {
		throw new Error('invalid-callee');
	}

	const call: Omit<IMediaCall, '_id' | '_updatedAt'> = {
		service: 'webrtc',
		kind: 'direct',
		state: 'none',

		createdBy: caller,
		createdAt: new Date(),
		sequence: 0,

		caller,
		callee,
	};

	const insertResult = await MediaCalls.insertOne(call);
	if (insertResult.insertedId) {
		await Promise.allSettled([
			createInitialChannel(insertResult.insertedId, caller, { role: 'caller' }, callerUser),
			createInitialChannel(insertResult.insertedId, callee, { role: 'callee' }, calleeUser),
		]);
	}

	console.log(insertResult);
}
