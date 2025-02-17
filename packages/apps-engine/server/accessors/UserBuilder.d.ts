import type { IUserBuilder } from '../../definition/accessors';
import { RocketChatAssociationModel } from '../../definition/metadata';
import type { IUser, IUserEmail } from '../../definition/users';
import type { IUserSettings } from '../../definition/users/IUserSettings';
export declare class UserBuilder implements IUserBuilder {
    kind: RocketChatAssociationModel.USER;
    private user;
    constructor(user?: Partial<IUser>);
    setData(data: Partial<IUser>): IUserBuilder;
    setEmails(emails: Array<IUserEmail>): IUserBuilder;
    getEmails(): Array<IUserEmail>;
    setDisplayName(name: string): IUserBuilder;
    getDisplayName(): string;
    setUsername(username: string): IUserBuilder;
    getUsername(): string;
    setRoles(roles: Array<string>): IUserBuilder;
    getRoles(): Array<string>;
    getSettings(): Partial<IUserSettings>;
    getUser(): Partial<IUser>;
}
