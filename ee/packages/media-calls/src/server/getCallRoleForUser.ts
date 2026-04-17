import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

export function getCallRoleForUser(call: IMediaCall, uid: IUser['_id']): CallRole | null {
	if (call.caller.type === 'user' && call.caller.id === uid) {
		return 'caller';
	}
	if (call.callee.type === 'user' && call.callee.id === uid) {
		return 'callee';
	}

	return null;
}
