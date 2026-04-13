import type { IMediaCall, IUser } from '@rocket.chat/core-typings';
import type { ServerMediaCallSignal } from '@rocket.chat/media-signaling';

import { getNewCallSignal } from './getNewCallSignal';
import { getCallRoleForUser } from '../getCallRoleForUser';
import { getInitialOfferSignal } from './getInitialOfferSignal';
import { getStateNotification } from './getStateNotification';

export async function getSignalsForExistingCall(call: IMediaCall, uid: IUser['_id'], contractId: string): Promise<ServerMediaCallSignal[]> {
	if (call.state === 'hangup') {
		return [];
	}

	const role = getCallRoleForUser(call, uid);
	if (!role) {
		return [];
	}

	const signals: ServerMediaCallSignal[] = [];
	signals.push(getNewCallSignal(call, role));

	const stateSignal = getStateNotification(call, role);
	if (stateSignal) {
		signals.push(stateSignal);
	}

	if (role === 'callee' && call.callee.contractId === contractId) {
		const initialOfferSignal = await getInitialOfferSignal(call, role);
		if (initialOfferSignal) {
			signals.push(initialOfferSignal);
		}
	}

	return signals;
}
