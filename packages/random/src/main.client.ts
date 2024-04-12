// We use cryptographically strong PRNGs (window.crypto.getRandomValues())
// when available. If these PRNGs fail, we fall back to the Alea PRNG, which is
// not cryptographically strong, and we seed it with various sources
// such as the date, Math.random, and window size on the client.
// When using window.crypto.getRandomValues() or alea, the primitive is fraction
// and we use that to construct hex string.

import { BrowserRandomGenerator } from './BrowserRandomGenerator';
import type { RandomGenerator } from './RandomGenerator';
import { createAleaGeneratorWithGeneratedSeed } from './createAleaGenerator';

let generator: RandomGenerator;
if (typeof window !== 'undefined' && !!window.crypto?.getRandomValues) {
	generator = new BrowserRandomGenerator();
} else {
	generator = createAleaGeneratorWithGeneratedSeed();
}

export const Random = generator;
