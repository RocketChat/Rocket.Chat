import { IMessage } from '@rocket.chat/core-typings';

export const messageArgs = (context: any): { msg: IMessage } => context?._arguments?.[1]?.hash || context;
