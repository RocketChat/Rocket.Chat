"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceRead = void 0;
class PersistenceRead {
    constructor(persistBridge, appId) {
        this.persistBridge = persistBridge;
        this.appId = appId;
    }
    read(id) {
        return this.persistBridge.doReadById(id, this.appId);
    }
    readByAssociation(association) {
        return this.persistBridge.doReadByAssociations(new Array(association), this.appId);
    }
    readByAssociations(associations) {
        return this.persistBridge.doReadByAssociations(associations, this.appId);
    }
}
exports.PersistenceRead = PersistenceRead;
//# sourceMappingURL=PersistenceRead.js.map