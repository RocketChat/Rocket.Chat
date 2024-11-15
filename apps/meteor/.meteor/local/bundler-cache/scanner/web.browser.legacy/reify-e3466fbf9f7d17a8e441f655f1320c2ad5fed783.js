"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserRandomGenerator = void 0;
const AleaRandomGenerator_1 = require("./AleaRandomGenerator");
const RandomGenerator_1 = require("./RandomGenerator");
const createAleaGenerator_1 = require("./createAleaGenerator");
// cryptographically strong PRNGs available in modern browsers
class BrowserRandomGenerator extends RandomGenerator_1.RandomGenerator {
    constructor() {
        super(...arguments);
        this.insecure = (0, createAleaGenerator_1.createAleaGeneratorWithGeneratedSeed)();
    }
    /**
     * @name Random.fraction
     * @summary Return a number between 0 and 1, like `Math.random`.
     * @locus Anywhere
     */
    fraction() {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] * 2.3283064365386963e-10; // 2^-32
    }
    safelyCreateWithSeeds(...seeds) {
        return new AleaRandomGenerator_1.AleaRandomGenerator({ seeds });
    }
}
exports.BrowserRandomGenerator = BrowserRandomGenerator;
//# sourceMappingURL=BrowserRandomGenerator.js.map