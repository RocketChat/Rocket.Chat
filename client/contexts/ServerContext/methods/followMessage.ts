import { IMessage } from '../../../../definition/IMessage';

export type FollowMessageMethod = (options: { mid: IMessage['_id'] }) => false | undefined;
