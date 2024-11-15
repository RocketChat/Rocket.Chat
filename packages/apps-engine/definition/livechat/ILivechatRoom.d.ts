import type { IRoom } from '../rooms/IRoom';
import type { IUser } from '../users';
import type { IDepartment } from './IDepartment';
import type { IVisitor } from './IVisitor';
export declare enum OmnichannelSourceType {
    WIDGET = "widget",
    EMAIL = "email",
    SMS = "sms",
    APP = "app",
    OTHER = "other"
}
interface IOmnichannelSourceApp {
    type: 'app';
    id: string;
    alias?: string;
    label?: string;
    sidebarIcon?: string;
    defaultIcon?: string;
    destination?: string;
}
type OmnichannelSource = {
    type: Exclude<OmnichannelSourceType, 'app'>;
} | IOmnichannelSourceApp;
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
export declare const isLivechatRoom: (room: IRoom) => room is ILivechatRoom;
export declare const isLivechatFromApp: (room: ILivechatRoom) => room is ILivechatRoom & {
    source: IOmnichannelSourceApp;
};
export {};
