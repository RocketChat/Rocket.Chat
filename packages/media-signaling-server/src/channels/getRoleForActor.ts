import type { IMediaCall, MediaCallActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

import { compareActorsIgnoringSession } from '../utils/compareActorsIgnoringSession';

export function getRoleForActor(call: IMediaCall, actor: MediaCallActor): CallRole | null {
	if (compareActorsIgnoringSession(call.caller, actor)) {
		return 'caller';
	}

	if (compareActorsIgnoringSession(call.callee, actor)) {
		return 'callee';
	}

	return null;
}
