"use strict";
// We use cryptographically strong PRNGs (window.crypto.getRandomValues())
// when available. If these PRNGs fail, we fall back to the Alea PRNG, which is
// not cryptographically strong, and we seed it with various sources
// such as the date, Math.random, and window size on the client.
// When using window.crypto.getRandomValues() or alea, the primitive is fraction
// and we use that to construct hex string.
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = void 0;
const BrowserRandomGenerator_1 = require("./BrowserRandomGenerator");
const createAleaGenerator_1 = require("./createAleaGenerator");
let generator;
if (typeof window !== 'undefined' && !!((_a = window.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues)) {
    generator = new BrowserRandomGenerator_1.BrowserRandomGenerator();
}
else {
    generator = (0, createAleaGenerator_1.createAleaGeneratorWithGeneratedSeed)();
}
exports.Random = generator;
//# sourceMappingURL=main.client.js.map