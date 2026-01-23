import type { IMessage } from './IMessage';

export type IExtras = {
	tmid?: IMessage['_id'];
};

export type IRoomActivity = Record<string, Record<string, ReturnType<typeof setTimeout>>>;
