"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIRegistrationInfo = exports.isIExtensionDetails = exports.isIQueueMembershipDetails = exports.isIVoipExtensionConfig = exports.isIVoipExtensionBase = exports.EndpointState = void 0;
var EndpointState;
(function (EndpointState) {
    EndpointState["UNKNOWN"] = "unknown";
    EndpointState["REGISTERED"] = "registered";
    EndpointState["UNREGISTERED"] = "unregistered";
    EndpointState["RINGING"] = "ringing";
    EndpointState["BUSY"] = "busy";
})(EndpointState || (exports.EndpointState = EndpointState = {}));
const isIVoipExtensionBase = (obj) => obj && typeof obj.name === 'string' && typeof obj.state === 'string';
exports.isIVoipExtensionBase = isIVoipExtensionBase;
const isIVoipExtensionConfig = (obj) => obj.name !== undefined && obj.state !== undefined && obj.authType !== undefined && obj.password !== undefined;
exports.isIVoipExtensionConfig = isIVoipExtensionConfig;
const isIQueueMembershipDetails = (obj) => obj && typeof obj.extension === 'string' && typeof obj.queueCount === 'number' && typeof obj.callWaitingCount === 'number';
exports.isIQueueMembershipDetails = isIQueueMembershipDetails;
const isIExtensionDetails = (prop) => prop.extension !== undefined && prop.password !== undefined && prop.authtype !== undefined && prop.state !== undefined;
exports.isIExtensionDetails = isIExtensionDetails;
const isIRegistrationInfo = (prop) => 'callServerConfig' in prop && 'extensionDetails' in prop;
exports.isIRegistrationInfo = isIRegistrationInfo;
//# sourceMappingURL=IVoipExtension.js.map