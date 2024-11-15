"use strict";
// We use cryptographically strong PRNGs (crypto.getRandomBytes() on the server,
// window.crypto.getRandomValues() in the browser) when available. If these
// PRNGs fail, we fall back to the Alea PRNG, which is not cryptographically
// strong, and we seed it with various sources such as the date, Math.random,
// and window size on the client.  When using crypto.getRandomValues(), our
// primitive is hexString(), from which we construct fraction(). When using
// window.crypto.getRandomValues() or alea, the primitive is fraction and we use
// that to construct hex string.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomGenerator = void 0;
const UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
const BASE64_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
// `type` is one of `RandomGenerator.Type` as defined below.
//
// options:
// - seeds: (required, only for RandomGenerator.Type.ALEA) an array
//   whose items will be `toString`ed and used as the seed to the Alea
//   algorithm
class RandomGenerator {
    /**
     * Create a non-cryptographically secure PRNG with a given seed (using
     * the Alea algorithm)
     */
    createWithSeeds(...seeds) {
        if (seeds.length === 0) {
            throw new Error('No seeds were provided');
        }
        return this.safelyCreateWithSeeds(...seeds);
    }
    /**
     * @name Random.hexString
     * @summary Return a random string of `n` hexadecimal digits.
     * @locus Anywhere
     * @param digits Length of the string
     */
    hexString(digits) {
        return this._randomString(digits, '0123456789abcdef');
    }
    _randomString(charsCount, alphabet) {
        let result = '';
        for (let i = 0; i < charsCount; i++) {
            result += this.choice(alphabet);
        }
        return result;
    }
    /**
     * @name Random.id
     * @summary Return a unique identifier, such as `"Jjwjg6gouWLXhMGKW"`, that is
     * likely to be unique in the whole world.
     * @locus Anywhere
     * @param charsCount Optional length of the identifier in characters
     *   (defaults to 17)
     */
    id(charsCount = 17) {
        // 17 characters is around 96 bits of entropy, which is the amount of state in the Alea PRNG.
        return this._randomString(charsCount, UNMISTAKABLE_CHARS);
    }
    /**
     * @name Random.secret
     * @summary Return a random string of printable characters with 6 bits of
     * entropy per character. Use `Random.secret` for security-critical secrets
     * that are intended for machine, rather than human, consumption.
     * @locus Anywhere
     * @param charsCount Optional length of the secret string (defaults to 43
     *   characters, or 256 bits of entropy)
     */
    secret(charsCount = 43) {
        // Default to 256 bits of entropy, or 43 characters at 6 bits per character.
        return this._randomString(charsCount, BASE64_CHARS);
    }
    /**
     * @name Random.choice
     * @summary Return a random element of the given array or string.
     * @locus Anywhere
     * @param {Array|String} arrayOrString Array or string to choose from
     */
    choice(arrayOrString) {
        const index = Math.floor(this.fraction() * arrayOrString.length);
        if (typeof arrayOrString === 'string') {
            return arrayOrString.substr(index, 1);
        }
        return arrayOrString[index];
    }
}
exports.RandomGenerator = RandomGenerator;
//# sourceMappingURL=RandomGenerator.js.map