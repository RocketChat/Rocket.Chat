import type { IUser } from '../users';

export interface IAppUpdateContext {
    user?: IUser;
    oldAppVersion: string;
}
