"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentRead = void 0;
class EnvironmentRead {
    constructor(settings, serverSettings, envRead) {
        this.settings = settings;
        this.serverSettings = serverSettings;
        this.envRead = envRead;
    }
    getSettings() {
        return this.settings;
    }
    getServerSettings() {
        return this.serverSettings;
    }
    getEnvironmentVariables() {
        return this.envRead;
    }
}
exports.EnvironmentRead = EnvironmentRead;
//# sourceMappingURL=EnvironmentRead.js.map