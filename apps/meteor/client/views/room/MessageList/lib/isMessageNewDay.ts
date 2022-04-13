import { isSameDay } from 'date-fns';

import { IMessage } from '../../../../../definition/IMessage';

export const isMessageNewDay = (current: IMessage, previous: IMessage | undefined): boolean =>
	!previous || !isSameDay(current.ts, previous.ts);
