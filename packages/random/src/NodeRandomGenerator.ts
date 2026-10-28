import crypto from 'node:crypto';

import { AleaRandomGenerator } from './AleaRandomGenerator';
import { RandomGenerator } from './RandomGenerator';
import { createAleaGeneratorWithGeneratedSeed } from './createAleaGenerator';

export class NodeRandomGenerator extends RandomGenerator {
	/**
	 * @name Random.fraction
	 * @summary Return a number between 0 and 1, like `Math.random`.
	 * @locus Anywhere
	 */
	fraction() {
		const numerator = Number.parseInt(this.hexString(8), 16);
		return numerator * 2.3283064365386963e-10; // 2^-3;
	}

	/**
	 * @name Random.hexString
	 * @summary Return a random string of `n` hexadecimal digits.
	 * @locus Anywhere
	 * @param digits Length of the string
	 */
	override hexString(digits: number) {
		const numBytes = Math.ceil(digits / 2);
		const bytes = this.randomBytes(numBytes);
		const result = bytes.toString('hex');
		// If the number of digits is odd, we'll have generated an extra 4 bits
		// of randomness, so we need to trim the last digit.
		return result.substring(0, digits);
	}

	override _randomString(charsCount: number, alphabet: string) {
		// Generate all the randomness in a single call instead of one
		// crypto.randomBytes() call per character. Each character consumes 4
		// bytes read as a big-endian uint32, matching what fraction() would
		// have produced, so the output distribution is unchanged.
		// Normalized like the base-class loop: NaN/negative counts yield an
		// empty string, fractional counts round up.
		const count = Number.isNaN(charsCount) ? 0 : Math.max(0, Math.ceil(charsCount));
		const bytes = this.randomBytes(count * 4);
		let result = '';
		for (let i = 0; i < count; i++) {
			const fraction = bytes.readUInt32BE(i * 4) * 2.3283064365386963e-10; // 2^-32
			result += alphabet.charAt(Math.floor(fraction * alphabet.length));
		}
		return result;
	}

	private randomBytes(numBytes: number): Buffer {
		// Try to get cryptographically strong randomness. Fall back to
		// non-cryptographically strong if not available.
		try {
			return crypto.randomBytes(numBytes);
		} catch (e) {
			// XXX should re-throw any error except insufficient entropy
			return crypto.pseudoRandomBytes(numBytes);
		}
	}

	/**
	 * @name Random.between Returns a random integer between min and max, inclusive.
	 * @param min Minimum value (inclusive)
	 * @param max Maximum value (inclusive)
	 * @returns A random integer between min and max, inclusive.
	 */
	between(min: number, max: number) {
		return Math.floor(this.fraction() * (max - min + 1)) + min;
	}

	protected safelyCreateWithSeeds(...seeds: readonly unknown[]) {
		return new AleaRandomGenerator({ seeds });
	}

	insecure: RandomGenerator = createAleaGeneratorWithGeneratedSeed();
}
