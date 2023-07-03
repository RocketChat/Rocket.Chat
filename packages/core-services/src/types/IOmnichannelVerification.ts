import type { IRoom, IOmnichannelGenericRoom } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export interface IOmnichannelVerification extends IServiceClass {
	initiateVerificationProcess(rid: IRoom['_id']): Promise<void>;
	verifyVisitorCode(room: IOmnichannelGenericRoom, _codeFromVisitor: string): Promise<boolean>;
}
