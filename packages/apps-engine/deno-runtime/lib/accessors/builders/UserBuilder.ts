import type { IUserBuilder } from '@rocket.chat/apps-engine/definition/accessors/IUserBuilder.ts';
import type { IUser } from '@rocket.chat/apps-engine/definition/users/IUser.ts';
import type { IUserSettings } from '@rocket.chat/apps-engine/definition/users/IUserSettings.ts';
import type { IUserEmail } from '@rocket.chat/apps-engine/definition/users/IUserEmail.ts';
import type { RocketChatAssociationModel as _RocketChatAssociationModel } from '@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.ts';

import { require } from '../../../lib/require.ts';

const { RocketChatAssociationModel } = require('@rocket.chat/apps-engine/definition/metadata/RocketChatAssociations.js') as {
    RocketChatAssociationModel: typeof _RocketChatAssociationModel;
};

export class UserBuilder implements IUserBuilder {
    public kind: _RocketChatAssociationModel.USER;

    private user: Partial<IUser>;

    constructor(user?: Partial<IUser>) {
        this.kind = RocketChatAssociationModel.USER;
        this.user = user || ({} as Partial<IUser>);
    }

    public setData(data: Partial<IUser>): IUserBuilder {
        delete data.id;
        this.user = data;

        return this;
    }

    public setEmails(emails: Array<IUserEmail>): IUserBuilder {
        this.user.emails = emails;
        return this;
    }

    public getEmails(): Array<IUserEmail> {
        return this.user.emails!;
    }

    public setDisplayName(name: string): IUserBuilder {
        this.user.name = name;
        return this;
    }

    public getDisplayName(): string {
        return this.user.name!;
    }

    public setUsername(username: string): IUserBuilder {
        this.user.username = username;
        return this;
    }

    public getUsername(): string {
        return this.user.username!;
    }

    public setRoles(roles: Array<string>): IUserBuilder {
        this.user.roles = roles;
        return this;
    }

    public getRoles(): Array<string> {
        return this.user.roles!;
    }

    public getSettings(): Partial<IUserSettings> {
        return this.user.settings;
    }

    public getUser(): Partial<IUser> {
        if (!this.user.username) {
            throw new Error('The "username" property is required.');
        }

        if (!this.user.name) {
            throw new Error('The "name" property is required.');
        }

        return this.user;
    }
}
