import type { IMitelCallHistoryItem, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

import type { MitelCallItem } from '../definition';

function getTypeData(typeOfCall: unknown): Pick<IMitelCallHistoryItem, 'direction' | 'state'> {
	if (typeOfCall === 'incoming-missed') {
		return {
			direction: 'inbound',
			state: 'not-answered',
		};
	}

	const direction = typeof typeOfCall === 'string' && typeOfCall.includes('outgoing') ? 'outbound' : 'inbound';
	return {
		direction,
		state: 'ended',
	};
}

export function convertMitelHistoryItem(item: Partial<MitelCallItem>, uid: IUser['_id']): InsertionModel<IMitelCallHistoryItem> {
	const {
		callIdentity: callId,
		dateTime: ts,
		typeOfCall,
		directoryNumber,
		duration = 0,
		name,
		// transferredCall: transferred,
		// divertedCall: diverted,
		// firstDialledNumber,
		// remoteNumber,
		// directoryNumber2: extraNumber,
		// name2: extraContactName,
	} = item;

	if (!callId) {
		throw new Error('Missing Call Identity');
	}

	if (!ts) {
		throw new Error('Missing TimeStamp');
	}

	const { direction, state } = getTypeData(typeOfCall);

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

		// ...(transferred && { transferred }),
		// ...(diverted && { diverted }),
		// ...(firstDialledNumber && { firstDialledNumber }),
		// ...(remoteNumber && { remoteNumber }),
		// ...(extraNumber && {
		// 	extra: {
		// 		number: extraNumber,
		// 		...(extraContactName && { contactName: extraContactName }),
		// 	},
		// }),
	};
}
