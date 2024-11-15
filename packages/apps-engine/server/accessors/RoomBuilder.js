"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomBuilder = void 0;
const metadata_1 = require("../../definition/metadata");
class RoomBuilder {
    constructor(data) {
        this.kind = metadata_1.RocketChatAssociationModel.ROOM;
        this.room = (data || { customFields: {} });
        this.members = [];
    }
    setData(data) {
        delete data.id;
        this.room = data;
        return this;
    }
    setDisplayName(name) {
        this.room.displayName = name;
        return this;
    }
    getDisplayName() {
        return this.room.displayName;
    }
    setSlugifiedName(name) {
        this.room.slugifiedName = name;
        return this;
    }
    getSlugifiedName() {
        return this.room.slugifiedName;
    }
    setType(type) {
        this.room.type = type;
        return this;
    }
    getType() {
        return this.room.type;
    }
    setCreator(creator) {
        this.room.creator = creator;
        return this;
    }
    getCreator() {
        return this.room.creator;
    }
    /**
     * @deprecated
     */
    addUsername(username) {
        this.addMemberToBeAddedByUsername(username);
        return this;
    }
    /**
     * @deprecated
     */
    setUsernames(usernames) {
        this.setMembersToBeAddedByUsernames(usernames);
        return this;
    }
    /**
     * @deprecated
     */
    getUsernames() {
        const usernames = this.getMembersToBeAddedUsernames();
        if (usernames && usernames.length > 0) {
            return usernames;
        }
        return this.room.usernames || [];
    }
    addMemberToBeAddedByUsername(username) {
        this.members.push(username);
        return this;
    }
    setMembersToBeAddedByUsernames(usernames) {
        this.members = usernames;
        return this;
    }
    getMembersToBeAddedUsernames() {
        return this.members;
    }
    setDefault(isDefault) {
        this.room.isDefault = isDefault;
        return this;
    }
    getIsDefault() {
        return this.room.isDefault;
    }
    setReadOnly(isReadOnly) {
        this.room.isReadOnly = isReadOnly;
        return this;
    }
    getIsReadOnly() {
        return this.room.isReadOnly;
    }
    setDisplayingOfSystemMessages(displaySystemMessages) {
        this.room.displaySystemMessages = displaySystemMessages;
        return this;
    }
    getDisplayingOfSystemMessages() {
        return this.room.displaySystemMessages;
    }
    addCustomField(key, value) {
        if (typeof this.room.customFields !== 'object') {
            this.room.customFields = {};
        }
        this.room.customFields[key] = value;
        return this;
    }
    setCustomFields(fields) {
        this.room.customFields = fields;
        return this;
    }
    getCustomFields() {
        return this.room.customFields;
    }
    getUserIds() {
        return this.room.userIds;
    }
    getRoom() {
        return this.room;
    }
}
exports.RoomBuilder = RoomBuilder;
//# sourceMappingURL=RoomBuilder.js.map