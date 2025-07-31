"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUserToContactInformation = mapUserToContactInformation;
function mapUserToContactInformation({ name, username, freeSwitchExtension, }) {
    return {
        ...(name && { name }),
        ...(username && { username }),
        ...(freeSwitchExtension && { number: freeSwitchExtension }),
    };
}
//# sourceMappingURL=mapUserToContactInformation.js.map