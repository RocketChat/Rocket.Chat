import type { IMitelCallHistoryItem, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

import type { MitelCallItem } from '../definition';

function getTypeData(item: Partial<MitelCallItem>): Pick<IMitelCallHistoryItem, 'direction' | 'state'> {
	const { typeOfCall, transferredCall } = item;

	if (typeOfCall === 'incoming-missed') {
		return {
			direction: 'inbound',
			state: 'not-answered',
		};
	}

	const direction = typeof typeOfCall === 'string' && typeOfCall.includes('outgoing') ? 'outbound' : 'inbound';
	if (transferredCall && direction === 'inbound') {
		return {
			direction,
			state: 'transferred',
		};
	}

	return {
		direction,
		state: 'ended',
	};
}

export function convertMitelHistoryItem(item: Partial<MitelCallItem>, uid: IUser['_id']): InsertionModel<IMitelCallHistoryItem> {
	const {
		callIdentity: callId,
		dateTime: ts,
		directoryNumber,
		duration = 0,
		name,
		transferredCall: transferred,
		divertedCall: diverted,
		directoryNumber2: extraNumber,
		name2: extraContactName,
	} = item;

	if (!callId) {
		throw new Error('Missing Call Identity');
	}

	if (!ts) {
		throw new Error('Missing TimeStamp');
	}

	const { direction, state } = getTypeData(item);

	const hasExtraContact = direction === 'inbound' && Boolean(extraNumber || extraContactName);
	const transferredFrom = diverted &&
		hasExtraContact && {
			...(extraNumber && { number: extraNumber }),
			...(extraContactName && { name: extraContactName }),
		};
	const transferredTo = transferred &&
		!diverted &&
		hasExtraContact && {
			...(extraNumber && { number: extraNumber }),
			...(extraContactName && { name: extraContactName }),
		};

	return {
		type: 'mitel',
		ts,
		uid,
		callId,
		direction,
		state,
		duration,
		...(directoryNumber && { contactNumber: directoryNumber }),
		...(name && { contactName: name }),

		...(diverted && { diverted }),
		...(transferredFrom && { transferredFrom }),

		...(transferred && { transferred }),
		...(transferredTo && { transferredTo }),
	};
}
