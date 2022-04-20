import type { IMessage } from '@rocket.chat/core-typings';

export type FollowMessageMethod = (options: { mid: IMessage['_id'] }) => false | undefined;
