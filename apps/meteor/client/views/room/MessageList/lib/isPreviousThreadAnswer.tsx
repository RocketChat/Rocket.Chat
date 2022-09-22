import { IMessage, isThreadMessage } from '@rocket.chat/core-typings';

export const isPreviousThreadAnswer = (previous: IMessage | undefined): boolean =>
	!!previous && !!previous.tshow && isThreadMessage(previous);
