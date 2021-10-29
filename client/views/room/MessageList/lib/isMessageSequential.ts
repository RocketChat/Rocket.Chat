import { differenceInMinutes } from 'date-fns';

import { IMessage } from '../../../../../definition/IMessage';

// TODO: use settings config to define time range instead of hardcoded value

export const isMessageSequential = (current: IMessage, previous: IMessage | undefined): boolean => {
	if (!previous) {
		return false;
	}

	if (current.t || previous.t) {
		return false;
	}

	if (current.tmid) {
		return [previous.tmid, previous._id].includes(current.tmid);
	}

	if (current.groupable === false) {
		return false;
	}

	if (current.u._id !== previous.u._id) {
		return false;
	}

	if (current.alias !== previous.alias) {
		return false;
	}

	return differenceInMinutes(current.ts, previous.ts) < 5;
};
