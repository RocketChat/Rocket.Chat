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

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class LivechatCreator implements ILivechatCreator {
	constructor(private readonly bridges: RemoteBridges) {}

	public resolveVisitor(externalId: IVisitorExternalIdentifier, contactData?: ResolveVisitorContactData): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doResolveVisitor(externalId, contactData, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public createRoom(visitor: IVisitor, agent: IUser, extraParams?: IExtraRoomParams): Promise<ILivechatRoom> {
		return this.bridges.getLivechatBridge().doCreateRoom(visitor, agent, 'APP_ID', extraParams) as Promise<ILivechatRoom>;
	}

	/**
	 * @deprecated Use `createAndReturnVisitor` instead.
	 */
	public createVisitor(visitor: IVisitor): Promise<string> {
		return this.bridges.getLivechatBridge().doCreateVisitor(visitor, 'APP_ID') as Promise<string>;
	}

	public createAndReturnVisitor(visitor: IVisitor): Promise<IVisitor | undefined> {
		return this.bridges.getLivechatBridge().doCreateAndReturnVisitor(visitor, 'APP_ID') as Promise<IVisitor | undefined>;
	}

	public createToken(): string {
		return randomBytes(16).toString('hex'); // Ensures 128 bits of entropy
	}
}
