import type { IThreadMessage } from '@rocket.chat/core-typings';

export type GetThreadMessagesMethod = (options: { tmid: IThreadMessage['tmid']; limit: number; skip: number }) => Array<IThreadMessage>;
