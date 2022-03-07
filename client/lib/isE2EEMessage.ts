import { IMessage } from '../../definition/IMessage';

export const isE2EEMessage = (message: IMessage): boolean => message.t === 'e2e';
