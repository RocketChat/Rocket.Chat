import type { IMediaCall, IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';

import { compareActorsIgnoringSession } from '../utils/compareActorsIgnoringSession';

export function getRoleForActor(call: IMediaCall, actor: MediaCallActor): IMediaCallChannel['role'] {
	if (compareActorsIgnoringSession(call.caller, actor)) {
		return 'caller';
	}

	if (compareActorsIgnoringSession(call.callee, actor)) {
		return 'callee';
	}

	return 'none';
}
