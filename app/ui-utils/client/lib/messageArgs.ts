import { IMessage } from '../../../../definition/IMessage';

export const messageArgs = (context: any): { msg: IMessage } => (context && context._arguments && context._arguments[1] && context._arguments[1].hash) || context;
