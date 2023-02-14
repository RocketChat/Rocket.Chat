import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

export const isOwnUserMessage = (message: IMessage, subscription?: ISubscription): boolean => message.u._id === subscription?.u._id;
