"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactCreator = void 0;
class ContactCreator {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
    }
    verifyContact(verifyContactChannelParams) {
        return this.bridges.getContactBridge().doVerifyContact(verifyContactChannelParams, this.appId);
    }
    addContactEmail(contactId, email) {
        return this.bridges.getContactBridge().doAddContactEmail(contactId, email, this.appId);
    }
}
exports.ContactCreator = ContactCreator;
//# sourceMappingURL=ContactCreator.js.map