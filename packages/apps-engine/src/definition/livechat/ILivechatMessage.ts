import type { IMessage } from '../messages/IMessage';
import type { IVisitor } from './IVisitor';

export interface ILivechatMessage extends IMessage {
    visitor?: IVisitor;
    token?: string;
}
