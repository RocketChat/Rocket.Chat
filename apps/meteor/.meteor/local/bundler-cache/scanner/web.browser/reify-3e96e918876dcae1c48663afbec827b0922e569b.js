"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operation = void 0;
/**
 * Enumerator representing current operation.
 * @remarks
 * This enumerator value along with callstate will be responsible for
 * valid actions while making/receiving a call to/from remote party.
 */
var Operation;
(function (Operation) {
    Operation[Operation["OP_NONE"] = 0] = "OP_NONE";
    Operation[Operation["OP_CONNECT"] = 1] = "OP_CONNECT";
    Operation[Operation["OP_REGISTER"] = 2] = "OP_REGISTER";
    Operation[Operation["OP_UNREGISTER"] = 3] = "OP_UNREGISTER";
    Operation[Operation["OP_PROCESS_INVITE"] = 4] = "OP_PROCESS_INVITE";
    Operation[Operation["OP_SEND_INVITE"] = 5] = "OP_SEND_INVITE";
    Operation[Operation["OP_CLEANUP"] = 6] = "OP_CLEANUP";
})(Operation || (exports.Operation = Operation = {}));
//# sourceMappingURL=Operations.js.map