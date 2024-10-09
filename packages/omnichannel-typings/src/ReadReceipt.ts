import type { ReadReceipt } from '@rocket.chat/core-typings';

import type { ILivechatVisitor } from './ILivechatVisitor';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ReadReceiptFromVisitor extends ReadReceipt {
	user: ILivechatVisitor;
}
