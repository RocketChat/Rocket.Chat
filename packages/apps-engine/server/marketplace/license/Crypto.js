"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crypto = void 0;
const crypto_1 = require("crypto");
class Crypto {
    constructor(internalBridge) {
        this.internalBridge = internalBridge;
    }
    decryptLicense(content) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKeySetting = yield this.internalBridge.doGetWorkspacePublicKey();
            if (!publicKeySetting || !publicKeySetting.value) {
                throw new Error('Public key not available, cannot decrypt'); // TODO: add custom error?
            }
            const decoded = (0, crypto_1.publicDecrypt)(publicKeySetting.value, Buffer.from(content, 'base64'));
            let license;
            try {
                license = JSON.parse(decoded.toString());
            }
            catch (error) {
                throw new Error('Invalid license provided');
            }
            return license;
        });
    }
}
exports.Crypto = Crypto;
//# sourceMappingURL=Crypto.js.map