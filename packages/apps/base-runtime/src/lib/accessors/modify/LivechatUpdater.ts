import type { ILivechatUpdater } from '@rocket.chat/apps-engine/definition/accessors';
import type {
	ILivechatRoom,
	ILivechatTransferData,
	IVisitor,
	IVisitorExternalIdentifier,
} from '@rocket.chat/apps-engine/definition/livechat';
import type { IUser } from '@rocket.chat/apps-engine/definition/users';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class LivechatUpdater implements ILivechatUpdater {
	constructor(private readonly bridges: RemoteBridges) {}

	public transferVisitor(visitor: IVisitor, transferData: ILivechatTransferData): Promise<boolean> {
		return this.bridges.getLivechatBridge().doTransferVisitor(visitor, transferData, 'APP_ID') as Promise<boolean>;
	}

	public closeRoom(room: ILivechatRoom, comment: string, closer?: IUser): Promise<boolean> {
		return this.bridges.getLivechatBridge().doCloseRoom(room, comment, closer, 'APP_ID') as Promise<boolean>;
	}

	public setCustomFields(token: IVisitor['token'], key: string, value: string, overwrite: boolean): Promise<boolean> {
		return this.bridges
			.getLivechatBridge()
			.doSetCustomFields({ token, key, value, overwrite }, 'APP_ID')
			.then((result) => (result as number) > 0);
	}

	public updateVisitorExternalId(visitorId: string, externalId: Omit<IVisitorExternalIdentifier, 'appId'>): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doUpdateVisitorExternalId(visitorId, externalId, 'APP_ID') as Promise<IVisitor | undefined>;
	}
}
