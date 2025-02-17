"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequiredApiVersionError = void 0;
const semver = require("semver");
class RequiredApiVersionError {
    constructor(info, versionInstalled) {
        this.name = 'RequiredApiVersion';
        let moreInfo = '';
        if (semver.gt(versionInstalled, info.requiredApiVersion)) {
            moreInfo = ' Please tell the author to update their App as it is out of date.';
        }
        this.message =
            `Failed to load the App "${info.name}" (${info.id}) as it requires ` +
                `v${info.requiredApiVersion} of the App API however your server comes with ` +
                `v${versionInstalled}.${moreInfo}`;
    }
}
exports.RequiredApiVersionError = RequiredApiVersionError;
//# sourceMappingURL=RequiredApiVersionError.js.map