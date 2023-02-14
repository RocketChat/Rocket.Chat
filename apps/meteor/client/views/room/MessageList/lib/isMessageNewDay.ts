import type { IMessage } from '@rocket.chat/core-typings';
import { isSameDay } from 'date-fns';

export const isMessageNewDay = (current: IMessage, previous: IMessage | undefined): boolean =>
	!previous || !isSameDay(current.ts, previous.ts);
