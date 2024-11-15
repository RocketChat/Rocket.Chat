import type { IUserUpdater } from '../../definition/accessors/IUserUpdater';
import type { UserStatusConnection } from '../../definition/users';
import type { IUser } from '../../definition/users/IUser';
import type { AppBridges } from '../bridges';
export declare class UserUpdater implements IUserUpdater {
    private readonly bridges;
    private readonly appId;
    constructor(bridges: AppBridges, appId: string);
    updateStatusText(user: IUser, statusText: IUser['statusText']): Promise<boolean>;
    updateStatus(user: IUser, statusText: IUser['statusText'], status: UserStatusConnection): Promise<boolean>;
    updateBio(user: IUser, bio: IUser['bio']): Promise<boolean>;
    updateCustomFields(user: IUser, customFields: IUser['customFields']): Promise<boolean>;
    deactivate(userId: IUser['id'], confirmRelinquish: boolean): Promise<boolean>;
}
