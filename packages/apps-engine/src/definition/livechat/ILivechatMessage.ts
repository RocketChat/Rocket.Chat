import type { IVisitor } from './IVisitor';
import type { IMessage } from '../messages/IMessage';

/**
 * A message in a Livechat conversation.
 *
 * A message the visitor wrote carries the visitor as well as the sender,
 * which is the only way to tell the two sides apart.
 */
export interface ILivechatMessage extends IMessage {
	/** The visitor who wrote the message, when the visitor did. */
	visitor?: IVisitor;
	/** The visitor's token, which identifies them across conversations. */
	token?: string;
}
