import type { IMediaCall, IUser, MediaCallActor } from '@rocket.chat/core-typings';
import { MediaCalls, Users } from '@rocket.chat/models';

import { createInitialChannel } from '../channels/createInitialChannel';
import { sendNewSignals } from '../signals/sendNewSignals';
import { mapUserToContactInformation } from '../utils/mapUserToContactInformation';

export async function createCall(caller: MediaCallActor, callee: MediaCallActor): Promise<IMediaCall> {
	if (caller.type !== 'user' || callee.type !== 'user') {
		throw new Error('not-implemented');
	}
	if (!caller.sessionId) {
		throw new Error('not-implemented');
	}

	const callerUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>>(caller.id, {
		projection: { username: 1, name: 1, freeSwitchExtension: 1 },
	});

	if (!callerUser?.username) {
		throw new Error('invalid-caller');
	}

	const calleeUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>>(callee.id, {
		projection: { username: 1, name: 1, freeSwitchExtension: 1 },
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

		caller: {
			...caller,
			...mapUserToContactInformation(callerUser),
		},
		callee: {
			...callee,
			...mapUserToContactInformation(calleeUser),
		},
	};

	const insertResult = await MediaCalls.insertOne(call);
	if (!insertResult.insertedId) {
		throw new Error('failed-to-create-call');
	}

	await Promise.allSettled([
		createInitialChannel(insertResult.insertedId, caller, { role: 'caller' }, callerUser),
		createInitialChannel(insertResult.insertedId, callee, { role: 'callee' }, calleeUser),
	]);

	return sendNewSignals(insertResult.insertedId);
}
