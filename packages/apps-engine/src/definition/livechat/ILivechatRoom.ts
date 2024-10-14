import { RoomType } from '../rooms';
import type { IRoom } from '../rooms/IRoom';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
import type { IVisitor } from './IVisitor';

export enum OmnichannelSourceType {
    WIDGET = 'widget',
    EMAIL = 'email',
    SMS = 'sms',
    APP = 'app',
    OTHER = 'other',
}

interface IOmnichannelSourceApp {
    type: 'app';
    id: string;
    // A human readable alias that goes with the ID, for post analytical purposes
    alias?: string;
    // A label to be shown in the room info
    label?: string;
    sidebarIcon?: string;
    defaultIcon?: string;
    // The destination of the message (e.g widget host, email address, whatsapp number, etc)
    destination?: string;
}
type OmnichannelSource =
    | {
          type: Exclude<OmnichannelSourceType, 'app'>;
      }
    | IOmnichannelSourceApp;

export interface IVisitorChannelInfo {
    lastMessageTs?: Date;
    phone?: string;
}

export interface ILivechatRoom extends IRoom {
    visitor: IVisitor;
    visitorChannelInfo?: IVisitorChannelInfo;
    department?: IDepartment;
    closer: 'user' | 'visitor' | 'bot';
    closedBy?: IUser;
    servedBy?: IUser;
    responseBy?: IUser;
    isWaitingResponse: boolean;
    isOpen: boolean;
    closedAt?: Date;
    source?: OmnichannelSource;
}

export const isLivechatRoom = (room: IRoom): room is ILivechatRoom => {
    return room.type === RoomType.LIVE_CHAT;
};
export const isLivechatFromApp = (room: ILivechatRoom): room is ILivechatRoom & { source: IOmnichannelSourceApp } => {
    return room.source && room.source.type === 'app';
};
