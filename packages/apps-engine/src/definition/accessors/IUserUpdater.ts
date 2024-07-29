import type { IUser } from '../users/IUser';

/**
 * Updating a user is a more granular approach, since
 * it is one of the more sensitive aspects of Rocket.Chat -
 * or any other system for that matter.
 *
 * Allowing apps to modify _all_ the aspects of a user
 * would open a critical surface for them to abuse such
 * power and "take hold" of a server, for instance.
 */
export interface IUserUpdater {
    updateStatusText(user: IUser, statusText: IUser['statusText']): Promise<boolean>;
    updateStatus(user: IUser, statusText: IUser['statusText'], status: IUser['status']): Promise<boolean>;
    updateBio(user: IUser, bio: IUser['bio']): Promise<boolean>;
    updateCustomFields(user: IUser, customFields: IUser['customFields']): Promise<boolean>;
    deactivate(userId: IUser['id'], confirmRelinquish: boolean): Promise<boolean>;
}
