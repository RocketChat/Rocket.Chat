import { IMessage } from '@rocket.chat/core-typings';

export const isE2EEMessage = (message: IMessage): boolean => message.t === 'e2e';
