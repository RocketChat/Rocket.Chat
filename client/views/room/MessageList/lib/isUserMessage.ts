import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';

export const isUserMessage = (message: IMessage, subscription?: ISubscription): boolean => message.u._id === subscription?.u._id;
