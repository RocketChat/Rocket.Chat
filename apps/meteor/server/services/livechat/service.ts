import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import type {
	IMessage,
	ILivechatVisitor,
	OmnichannelSourceType,
	IOmnichannelRoom,
	IUser,
	IRoom,
	ILivechatAgent,
} from '@rocket.chat/core-typings';

import type { ILivechatService } from '../../sdk/types/ILivechatService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { Livechat } from '../../../app/livechat/server';

export class LivechatService extends ServiceClassInternal implements ILivechatService {
	async isOnline(department?: string, skipNoAgentSetting?: boolean, skipFallbackCheck?: boolean): Promise<boolean> {
		return Livechat.online(department, skipNoAgentSetting, skipFallbackCheck);
	}

	async sendMessage(props: { guest: IVisitor; message: IMessage; roomInfo: Record<string, unknown>; agent: string }): Promise<any> {
		return Livechat.sendMessage(props);
	}

	async updateMessage(props: { guest: IVisitor; message: IMessage }): Promise<boolean | undefined> {
		return Livechat.updateMessage(props);
	}

	async getRoom(props: {
		guest: ILivechatVisitor;
		rid?: string;
		roomInfo?: {
			source?: {
				type: OmnichannelSourceType;
				id?: string;
				alias?: string;
				label?: string;
				sidebarIcon?: string;
				defaultIcon?: string;
			};
		};
		agent?: { agentId?: string; username?: string };
		extraParams?: Record<string, any>;
	}): Promise<{ room: IOmnichannelRoom; newRoom: boolean }> {
		return Livechat.getRoom(props);
	}

	async closeRoom(props: {
		user: IUser;
		visitor: IVisitor;
		room: IRoom;
		comment: string;
		options?: Record<string, unknown>;
	}): Promise<boolean> {
		return Livechat.closeRoom(props);
	}

	registerGuest(props: {
		id?: string;
		token: string;
		name: string;
		email: string;
		department?: string;
		phone?: { number: string };
		username: string;
		connectionData?: string;
		status?: string;
	}): Promise<string> {
		return Livechat.registerGuest(props as any);
	}

	transferVisitor(
		room: IRoom,
		visitor: IVisitor,
		transferData: {
			userId?: string;
			departmentId?: string;
			transferredTo: ILivechatAgent;
			transferredBy: { _id: string; username?: string; name?: string; type: string };
		},
	): Promise<boolean> {
		return Livechat.transfer(room, visitor, transferData);
	}

	getRoomMessages(roomId: string): Promise<IMessage[]> {
		return Livechat.getRoomMessages({ rid: roomId });
	}

	setCustomFields(props: { token: string; key: string; value: string; overwrite: boolean }): Promise<number> {
		return Livechat.setCustomFields(props);
	}
}
