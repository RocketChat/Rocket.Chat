"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaCallBasicAgent = void 0;
class MediaCallBasicAgent {
    get actor() {
        return {
            type: 'user',
            id: this.actorId,
            contractId: this.contractId,
        };
    }
    get oppositeRole() {
        return { callee: 'caller', caller: 'callee' }[this.role];
    }
    constructor(data) {
        this.actorType = data.type;
        this.actorId = data.id;
        this.role = data.role;
        this.contractId = data.contractId;
    }
    isRepresentingActor(actor) {
        return actor.type === this.actorType && actor.id === this.actorId;
    }
    isRepresentingContract(actor, contractId) {
        return this.isRepresentingActor(actor) && this.contractId === contractId;
    }
}
exports.MediaCallBasicAgent = MediaCallBasicAgent;
//# sourceMappingURL=IMediaCallAgent.js.map