import type { IVisitor } from './IVisitor';
import type { IMessage } from '../messages/IMessage';

export interface ILivechatMessage extends IMessage {
    visitor?: IVisitor;
    token?: string;
}
