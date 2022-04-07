import { IMessage } from '../../../../definition/IMessage';

export const messageArgs = (context: any): { msg: IMessage } => context?._arguments?.[1]?.hash || context;
