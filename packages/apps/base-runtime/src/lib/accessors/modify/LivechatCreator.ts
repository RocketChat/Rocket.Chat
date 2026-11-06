import { randomBytes } from 'node:crypto';

import type { ILivechatCreator } from '@rocket.chat/apps-engine/definition/accessors';
import type { IExtraRoomParams } from '@rocket.chat/apps-engine/definition/accessors/ILivechatCreator';
import type { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import type {
	IVisitorExternalIdentifier,
	IVisitor,
	ResolveVisitorContactData,
} from '@rocket.chat/apps-engine/definition/livechat/IVisitor';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class LivechatCreator implements ILivechatCreator {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public resolveVisitor(externalId: IVisitorExternalIdentifier, contactData?: ResolveVisitorContactData): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doResolveVisitor', externalId, contactData, 'APP_ID');
	}

	public createRoom(visitor: IVisitor, agent: IUser, extraParams?: IExtraRoomParams): Promise<ILivechatRoom> {
		return bridgeCall<ILivechatRoom>(this.senderFn, 'getLivechatBridge', 'doCreateRoom', visitor, agent, 'APP_ID', extraParams);
	}

	/**
	 * @deprecated Use `createAndReturnVisitor` instead.
	 */
	public createVisitor(visitor: IVisitor): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getLivechatBridge', 'doCreateVisitor', visitor, 'APP_ID');
	}

	public createAndReturnVisitor(visitor: IVisitor): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(this.senderFn, 'getLivechatBridge', 'doCreateAndReturnVisitor', visitor, 'APP_ID');
	}

	public createToken(): string {
		return randomBytes(16).toString('hex'); // Ensures 128 bits of entropy
	}
}
