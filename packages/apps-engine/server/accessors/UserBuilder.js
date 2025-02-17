"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBuilder = void 0;
const metadata_1 = require("../../definition/metadata");
class UserBuilder {
    constructor(user) {
        this.kind = metadata_1.RocketChatAssociationModel.USER;
        this.user = user || {};
    }
    setData(data) {
        delete data.id;
        this.user = data;
        return this;
    }
    setEmails(emails) {
        this.user.emails = emails;
        return this;
    }
    getEmails() {
        return this.user.emails;
    }
    setDisplayName(name) {
        this.user.name = name;
        return this;
    }
    getDisplayName() {
        return this.user.name;
    }
    setUsername(username) {
        this.user.username = username;
        return this;
    }
    getUsername() {
        return this.user.username;
    }
    setRoles(roles) {
        this.user.roles = roles;
        return this;
    }
    getRoles() {
        return this.user.roles;
    }
    getSettings() {
        return this.user.settings;
    }
    getUser() {
        if (!this.user.username) {
            throw new Error('The "username" property is required.');
        }
        if (!this.user.name) {
            throw new Error('The "name" property is required.');
        }
        return this.user;
    }
}
exports.UserBuilder = UserBuilder;
//# sourceMappingURL=UserBuilder.js.map