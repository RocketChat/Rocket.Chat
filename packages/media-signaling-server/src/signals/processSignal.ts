import type { IUser } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';
import { MediaCalls, Users } from '@rocket.chat/models';

import { processDeliver } from './deliver/processDeliver';
import { getChannelForSignal } from './getChannelForSignal';
import { processNotify } from './notify/processNotify';
import { assertSignalHasSessionId } from '../utils/assertSignalHasSessionId';

export async function processSignal(signal: MediaSignal, uid: IUser['_id']): Promise<void> {
	assertSignalHasSessionId(signal);
	console.log('server.processSignal', signal);

	const call = await MediaCalls.findOneById(signal.callId);
	if (!call) {
		throw new Error('invalid-call');
	}

	const user = await Users.findOneById<Pick<Required<IUser>, '_id' | 'username' | 'name'>>(uid, { projection: { username: 1, name: 1 } });
	if (!user?.username || !user?.name) {
		throw new Error('invalid-user');
	}

	const channel = await getChannelForSignal(signal, call, user);

	switch (signal.type) {
		// case 'request':
		// 	await processRequest(signal);
		// 	break;
		case 'deliver':
			await processDeliver(signal, call, channel);
			break;
		case 'notify':
			await processNotify(signal, call, channel);
			break;
	}
}
