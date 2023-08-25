import type { IRoom, IOmnichannelGenericRoom, IOmnichannelRoom, IMessage } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface ISetVisitorEmailResult {
	success: boolean;
	error?: Error | undefined;
}
export interface IOmnichannelVerification extends IServiceClass {
	initiateVerificationProcess(rid: IRoom['_id']): Promise<void>;
	verifyVisitorCode(room: IOmnichannelRoom, _codeFromVisitor: string): Promise<boolean>;
	setVisitorEmail(room: IOmnichannelRoom, email: string): Promise<ISetVisitorEmailResult>;
	sendVerificationCodeToVisitor(visitorId: string, room: IOmnichannelGenericRoom): Promise<void>;
	createLivechatMessage(room: IOmnichannelRoom, text: string): Promise<IMessage['_id']>;
}
