"use strict";
/**
 * Enumerator SIP User's workflow types
 * @remarks
 * Depending on whether the user is contact center user or a stand alone user,
 * certain data structures will be initialised
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTypes = void 0;
var WorkflowTypes;
(function (WorkflowTypes) {
    WorkflowTypes[WorkflowTypes["STANDALONE_USER"] = 0] = "STANDALONE_USER";
    WorkflowTypes[WorkflowTypes["CONTACT_CENTER_USER"] = 1] = "CONTACT_CENTER_USER";
})(WorkflowTypes || (exports.WorkflowTypes = WorkflowTypes = {}));
//# sourceMappingURL=WorkflowTypes.js.map