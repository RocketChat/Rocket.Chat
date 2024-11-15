"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOAuth2Client = createOAuth2Client;
const OAuth2Client_1 = require("../../server/oauth2/OAuth2Client");
/**
 * Placeholder factory for OAuth2Client in case
 * we need to pass internal stuff to it.
 *
 * @param app App that will connect via OAuth2
 * @param options Options for the OAuth2Client
 * @returns OAuth2Client instance
 */
function createOAuth2Client(app, options) {
    return new OAuth2Client_1.OAuth2Client(app, options);
}
//# sourceMappingURL=OAuth2.js.map