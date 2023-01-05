import type { IMessage } from '@rocket.chat/core-typings';

export type IOmniRoomClosingMessage = Pick<IMessage, 't' | 'groupable'> & Partial<Pick<IMessage, 'msg'>>;
