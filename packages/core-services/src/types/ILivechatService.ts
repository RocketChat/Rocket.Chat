import type { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import type {
	IMessage,
	ILivechatVisitor,
	OmnichannelSourceType,
	IOmnichannelRoom,
	IRoom,
	ILivechatAgent,
	IUser,
} from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

type GenericCloseRoomParams = {
	room: IOmnichannelRoom;
	comment?: string;
	options?: {
		clientAction?: boolean;
		tags?: string[];
		emailTranscript?:
			| {
					sendToVisitor: false;
			  }
			| {
					sendToVisitor: true;
					requestData: NonNullable<IOmnichannelRoom['transcriptRequest']>;
			  };
		pdfTranscript?: {
			requestedBy: string;
		};
	};
};

export type CloseRoomParamsByUser = {
	user: IUser;
} & GenericCloseRoomParams;

export type CloseRoomParamsByVisitor = {
	visitor: ILivechatVisitor;
} & GenericCloseRoomParams;

export type CloseRoomParams = CloseRoomParamsByUser | CloseRoomParamsByVisitor;

export interface ILivechatService extends IServiceClass {
	isOnline(department?: string, skipNoAgentSetting?: boolean, skipFallbackCheck?: boolean): Promise<boolean>;
	sendMessage(props: { guest: IVisitor; message: IMessage; roomInfo: Record<string, unknown>; agent: string | undefined }): Promise<any>;
	updateMessage(props: { guest: IVisitor; message: IMessage }): Promise<boolean | undefined>;
	getRoom(props: {
		guest: ILivechatVisitor;
		rid?: string;
		roomInfo?: {
			source?: { type: OmnichannelSourceType; id?: string; alias?: string; label?: string; sidebarIcon?: string; defaultIcon?: string };
		};
		agent?: { agentId?: string; username?: string };
		extraParams?: Record<string, any>;
	}): Promise<{ room: IOmnichannelRoom; newRoom: boolean }>;
	closeRoom(props: CloseRoomParams): Promise<void>;
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
	}): Promise<string>;
	transferVisitor(
		room: IRoom,
		visitor: IVisitor,
		transferData: {
			userId?: string;
			departmentId?: string;
			transferredTo: ILivechatAgent;
			transferredBy: {
				_id: string;
				username?: string;
				name?: string;
				type: string;
			};
		},
	): Promise<boolean>;
	getRoomMessages(roomId: string): Promise<Array<IMessage>>;
	setCustomFields(props: { token: string; key: string; value: string; overwrite: boolean }): Promise<number>;
}
