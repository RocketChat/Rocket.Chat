import { differenceInMinutes } from 'date-fns';

import { IMessage } from '../../../../../definition/IMessage';

export const isMessageSequential = (current: IMessage, previous?: IMessage): boolean => {
	if (!previous) {
		return false;
	}
	return differenceInMinutes(current.ts, previous.ts) < 5;
};
