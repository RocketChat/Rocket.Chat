"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Persistence = void 0;
class Persistence {
    constructor(persistBridge, appId) {
        this.persistBridge = persistBridge;
        this.appId = appId;
    }
    create(data) {
        return this.persistBridge.doCreate(data, this.appId);
    }
    createWithAssociation(data, association) {
        return this.persistBridge.doCreateWithAssociations(data, new Array(association), this.appId);
    }
    createWithAssociations(data, associations) {
        return this.persistBridge.doCreateWithAssociations(data, associations, this.appId);
    }
    update(id, data, upsert = false) {
        return this.persistBridge.doUpdate(id, data, upsert, this.appId);
    }
    updateByAssociation(association, data, upsert = false) {
        return this.persistBridge.doUpdateByAssociations(new Array(association), data, upsert, this.appId);
    }
    updateByAssociations(associations, data, upsert = false) {
        return this.persistBridge.doUpdateByAssociations(associations, data, upsert, this.appId);
    }
    remove(id) {
        return this.persistBridge.doRemove(id, this.appId);
    }
    removeByAssociation(association) {
        return this.persistBridge.doRemoveByAssociations(new Array(association), this.appId);
    }
    removeByAssociations(associations) {
        return this.persistBridge.doRemoveByAssociations(associations, this.appId);
    }
}
exports.Persistence = Persistence;
//# sourceMappingURL=Persistence.js.map