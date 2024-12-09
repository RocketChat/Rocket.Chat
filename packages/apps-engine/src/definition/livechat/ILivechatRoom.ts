import { RoomType } from '../rooms';
import type { IRoom } from '../rooms/IRoom';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
import type { ILivechatContact } from './ILivechatContact';
import type { IVisitor } from './IVisitor';

export enum OmnichannelSourceType {
    WIDGET = 'widget',
    EMAIL = 'email',
    SMS = 'sms',
    APP = 'app',
    API = 'api',
    OTHER = 'other',
}

export interface IOmnichannelSource {
    type: OmnichannelSourceType;
    // An optional identification of external sources, such as an App
    id?: string;
    // A human readable alias that goes with the ID, for post analytical purposes
    alias?: string;
    // A label to be shown in the room info
    label?: string;
    // The sidebar icon
    sidebarIcon?: string;
    // The default sidebar icon
    defaultIcon?: string;
    // The destination of the message (e.g widget host, email address, whatsapp number, etc)
    destination?: string;
}

interface IOmnichannelSourceApp {
    type: 'app';
    // An optional identification of external sources, such as an App
    id?: string;
    // A human readable alias that goes with the ID, for post analytical purposes
    alias?: string;
    // A label to be shown in the room info
    label?: string;
    // The sidebar icon
    sidebarIcon?: string;
    // The default sidebar icon
    defaultIcon?: string;
    // The destination of the message (e.g widget host, email address, whatsapp number, etc)
    destination?: string;
}

export type OmnichannelSource =
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
    contact?: ILivechatContact;
}

export const isLivechatRoom = (room: IRoom): room is ILivechatRoom => {
    return room.type === RoomType.LIVE_CHAT;
};
export const isLivechatFromApp = (room: ILivechatRoom): room is ILivechatRoom & { source: IOmnichannelSourceApp } => {
    return room.source && room.source.type === 'app';
};
