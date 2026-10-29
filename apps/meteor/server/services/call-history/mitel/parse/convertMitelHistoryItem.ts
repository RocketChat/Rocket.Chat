import type { IMitelCallHistoryItem, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

import type { MitelCallItem } from '../definition';

function getTypeData(item: Partial<MitelCallItem>): Pick<IMitelCallHistoryItem, 'direction' | 'state'> {
	const { typeOfCall, transferredCall } = item;

	const direction = typeOfCall?.startsWith('out') ? 'outbound' : 'inbound';

	if (typeOfCall?.endsWith('-missed')) {
		return {
			direction,
			state: 'not-answered',
		};
	}

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

type ConversionOptions = {
	numberLookup?: (number?: string) => { uid: string; name: string; username: string } | null;
};

export function convertMitelHistoryItem(
	item: Partial<MitelCallItem>,
	uid: IUser['_id'],
	options: ConversionOptions = {},
): InsertionModel<IMitelCallHistoryItem> {
	const { numberLookup = () => null } = options;

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

	const directoryLookup = numberLookup(directoryNumber);

	const hasExtraContact = direction === 'inbound' && Boolean(extraNumber || extraContactName);
	const extraNumberLookup = numberLookup(extraNumber);

	const extraContact = hasExtraContact && {
		...(extraNumber && { number: extraNumber }),
		...(extraContactName && { name: extraContactName }),
		...extraNumberLookup,
	};

	const transferredFrom = diverted && extraContact;
	const transferredTo = transferred && !diverted && extraContact;

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
		...(directoryLookup && {
			contactId: directoryLookup.uid,
			contactName: directoryLookup.name,
			contactUsername: directoryLookup.username,
		}),

		...(diverted && { diverted }),
		...(transferredFrom && { transferredFrom }),

		...(transferred && { transferred }),
		...(transferredTo && { transferredTo }),
	};
}
