import type { ILivechatAgent } from './ILivechatAgent';
import type { ILivechatVisitor } from './ILivechatVisitor';

declare module '@rocket.chat/core-typings' {
	interface IAuditLog {
		visitor?: ILivechatVisitor['_id'];
		agent?: ILivechatAgent['_id'];
	}
}
