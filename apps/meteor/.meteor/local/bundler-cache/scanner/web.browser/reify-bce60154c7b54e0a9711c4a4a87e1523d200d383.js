"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAleaGeneratorWithGeneratedSeed = createAleaGeneratorWithGeneratedSeed;
const AleaRandomGenerator_1 = require("./AleaRandomGenerator");
// instantiate RNG.  Heuristically collect entropy from various sources when a
// cryptographic PRNG isn't available.
// client sources
const height = (typeof window !== 'undefined' && window.innerHeight) ||
    (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) ||
    (typeof document !== 'undefined' && document.body && document.body.clientHeight) ||
    1;
const width = (typeof window !== 'undefined' && window.innerWidth) ||
    (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) ||
    (typeof document !== 'undefined' && document.body && document.body.clientWidth) ||
    1;
const agent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
function createAleaGeneratorWithGeneratedSeed() {
    return new AleaRandomGenerator_1.AleaRandomGenerator({
        seeds: [new Date(), height, width, agent, Math.random()],
    });
}
//# sourceMappingURL=createAleaGenerator.js.map