import type { ILivechatUpdater } from '@rocket.chat/apps-engine/definition/accessors';
import type {
	ILivechatRoom,
	ILivechatTransferData,
	IVisitor,
	IVisitorExternalIdentifier,
} from '@rocket.chat/apps-engine/definition/livechat';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class LivechatUpdater implements ILivechatUpdater {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getLivechatBridge', 'doTransferVisitor', visitor, transferData, 'APP_ID');
	}

	public closeRoom(room: ILivechatRoom, comment: string, closer?: IUser): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getLivechatBridge', 'doCloseRoom', room, comment, closer, 'APP_ID');
	}

	public setCustomFields(token: IVisitor['token'], key: string, value: string, overwrite: boolean): Promise<boolean> {
		return bridgeCall(this.senderFn, 'getLivechatBridge', 'doSetCustomFields', { token, key, value, overwrite }, 'APP_ID').then(
			(result) => (result as number) > 0,
		);
	}

	public updateVisitorExternalId(visitorId: string, externalId: Omit<IVisitorExternalIdentifier, 'appId'>): Promise<IVisitor | undefined> {
		return bridgeCall<IVisitor | undefined>(
			this.senderFn,
			'getLivechatBridge',
			'doUpdateVisitorExternalId',
			visitorId,
			externalId,
			'APP_ID',
		);
	}
}
