"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIExtend = void 0;
class UIExtend {
    constructor(manager, appId) {
        this.manager = manager;
        this.appId = appId;
    }
    registerButton(button) {
        this.manager.registerActionButton(this.appId, button);
    }
}
exports.UIExtend = UIExtend;
//# sourceMappingURL=UIExtend.js.map