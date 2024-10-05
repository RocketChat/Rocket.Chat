import type { IVisitor } from '../livechat';
import type { IRoom } from '../rooms';
import type { IUser } from '../users';
import type { StoreType } from './StoreType';

export interface IUpload {
    id: string;
    name: string;
    size: string;
    type: string;
    extension: string;
    etag: string;
    path: string;
    token: string;
    url: string;
    progress: number;
    uploading: boolean;
    complete: boolean;
    updatedAt: Date;
    uploadedAt: Date;
    store: StoreType;
    room: IRoom;
    visitor?: IVisitor;
    user?: IUser;
}
