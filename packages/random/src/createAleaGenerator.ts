import { AleaRandomGenerator } from './AleaRandomGenerator.js';

// instantiate RNG.  Heuristically collect entropy from various sources when a
// cryptographic PRNG isn't available.

// client sources
const height =
	globalThis.window?.innerHeight || globalThis.document?.documentElement?.clientHeight || globalThis.document?.body?.clientHeight || 1;

const width =
	globalThis.window?.innerWidth || globalThis.document?.documentElement?.clientWidth || globalThis.document?.body?.clientWidth || 1;

const agent = globalThis.navigator?.userAgent || '';

export function createAleaGeneratorWithGeneratedSeed() {
	return new AleaRandomGenerator({
		seeds: [new Date(), height, width, agent, Math.random()],
	});
}
