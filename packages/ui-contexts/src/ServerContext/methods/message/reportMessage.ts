import type { IMessage } from '@rocket.chat/core-typings';

export type ReportMessageMethod = (messageId: IMessage['_id'], description: string) => true;
