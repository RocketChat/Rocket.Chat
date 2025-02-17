"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRead = void 0;
class ContactRead {
    constructor(bridges, appId) {
        this.bridges = bridges;
        this.appId = appId;
    }
    getById(contactId) {
        return this.bridges.getContactBridge().doGetById(contactId, this.appId);
    }
}
exports.ContactRead = ContactRead;
//# sourceMappingURL=ContactRead.js.map