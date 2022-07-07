import { IMessage } from '@rocket.chat/core-typings';

export const isOTRMessage = (message: IMessage): boolean => message.t === 'otr' || message.t === 'otr-ack';
