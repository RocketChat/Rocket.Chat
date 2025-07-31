"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareParticipantAndActor = compareParticipantAndActor;
function compareParticipantAndActor(participant, actor) {
    if (participant.type !== actor.type || participant.id !== actor.id) {
        return false;
    }
    if (actor.type === 'user') {
        const user = participant;
        return !actor.sessionId || actor.sessionId === user.sessionId;
    }
    return true;
}
//# sourceMappingURL=compareParticipantAndActor.js.map