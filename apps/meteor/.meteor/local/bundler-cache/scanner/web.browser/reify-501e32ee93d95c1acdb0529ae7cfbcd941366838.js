"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDeviceConstraints = void 0;
const react_1 = require("react");
const DeviceContext_1 = require("../DeviceContext");
const useDeviceConstraints = () => {
    var _a;
    const context = (0, react_1.useContext)(DeviceContext_1.DeviceContext);
    if (!(0, DeviceContext_1.isDeviceContextEnabled)(context)) {
        console.warn('Device Management is disabled on unsecure contexts, see https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts');
        return null;
    }
    const selectedAudioInputDeviceId = (_a = context.selectedAudioInputDevice) === null || _a === void 0 ? void 0 : _a.id;
    return { audio: selectedAudioInputDeviceId === 'default' ? true : { deviceId: { exact: selectedAudioInputDeviceId } } };
};
exports.useDeviceConstraints = useDeviceConstraints;
//# sourceMappingURL=useDeviceConstraints.js.map