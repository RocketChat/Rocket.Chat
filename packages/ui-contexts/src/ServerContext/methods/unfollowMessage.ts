import type { IMessage } from '@rocket.chat/core-typings';

export type UnfollowMessageMethod = (options: { mid: IMessage['_id'] }) => false | undefined;
