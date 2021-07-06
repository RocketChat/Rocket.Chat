import { IMessage } from '../../../../definition/IMessage';

export type UnfollowMessageMethod = (options: { mid: IMessage['_id'] }) => false | undefined;
