"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDetailChangesBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
/**
 * An abstract class which will contain various methods related to Apps
 * which are called for various inner detail working changes. This
 * allows for us to notify various external components of internal
 * changes.
 */
class AppDetailChangesBridge extends BaseBridge_1.BaseBridge {
    doOnAppSettingsChange(appId, setting) {
        return this.onAppSettingsChange(appId, setting);
    }
}
exports.AppDetailChangesBridge = AppDetailChangesBridge;
//# sourceMappingURL=AppDetailChangesBridge.js.map