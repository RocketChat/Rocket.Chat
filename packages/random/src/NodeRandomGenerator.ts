import crypto from 'crypto';

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
	hexString(digits: number) {
		const numBytes = Math.ceil(digits / 2);
		let bytes;
		// Try to get cryptographically strong randomness. Fall back to
		// non-cryptographically strong if not available.
		try {
			bytes = crypto.randomBytes(numBytes);
		} catch (e) {
			// XXX should re-throw any error except insufficient entropy
			bytes = crypto.pseudoRandomBytes(numBytes);
		}
		const result = bytes.toString('hex');
		// If the number of digits is odd, we'll have generated an extra 4 bits
		// of randomness, so we need to trim the last digit.
		return result.substring(0, digits);
	}

	protected safelyCreateWithSeeds(...seeds: readonly unknown[]) {
		return new AleaRandomGenerator({ seeds });
	}

	insecure: RandomGenerator = createAleaGeneratorWithGeneratedSeed();
}
