import { RandomGenerator } from './RandomGenerator';

// Alea PRNG, which is not cryptographically strong
// see http://baagoe.org/en/wiki/Better_random_numbers_for_javascript
// for a full discussion and Alea implementation.
function createAlea(seeds: readonly unknown[]) {
	function createMash() {
		let n = 0xefc8249d;

		const mash = (data: unknown) => {
			data = String(data);
			if (typeof data !== 'string') {
				throw new Error('Expected a string');
			}

			for (let i = 0; i < data.length; i++) {
				n += data.charCodeAt(i);
				let h = 0.02519603282416938 * n;
				n = h >>> 0;
				h -= n;
				h *= n;
				n = h >>> 0;
				h -= n;
				n += h * 0x100000000; // 2^32
			}
			return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
		};

		mash.version = 'Mash 0.9';
		return mash;
	}

	let s0 = 0;
	let s1 = 0;
	let s2 = 0;
	let c = 1;
	if (seeds.length === 0) {
		seeds = [+new Date()];
	}
	const mash = createMash();
	s0 = mash(' ');
	s1 = mash(' ');
	s2 = mash(' ');

	for (let i = 0; i < seeds.length; i++) {
		s0 -= mash(seeds[i]);
		if (s0 < 0) {
			s0 += 1;
		}
		s1 -= mash(seeds[i]);
		if (s1 < 0) {
			s1 += 1;
		}
		s2 -= mash(seeds[i]);
		if (s2 < 0) {
			s2 += 1;
		}
	}

	const random = () => {
		const t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
		s0 = s1;
		s1 = s2;
		s2 = t - (c = t | 0);
		return s2;
	};

	random.uint32 = () => random() * 0x100000000; // 2^32
	random.fract53 = () => random() + ((random() * 0x200000) | 0) * 1.1102230246251565e-16; // 2^-53

	random.version = 'Alea 0.9';
	random.args = seeds;
	return random;
}

// options:
// - seeds: an array
//   whose items will be `toString`ed and used as the seed to the Alea
//   algorithm
export class AleaRandomGenerator extends RandomGenerator {
	private readonly alea: () => number;

	constructor({ seeds = [] }: { seeds?: readonly unknown[] } = {}) {
		super();
		if (!seeds) {
			throw new Error('No seeds were provided for Alea PRNG');
		}
		this.alea = createAlea(seeds);
	}

	/**
	 * @name Random.fraction
	 * @summary Return a number between 0 and 1, like `Math.random`.
	 * @locus Anywhere
	 */
	fraction() {
		return this.alea();
	}

	protected safelyCreateWithSeeds(...seeds: readonly unknown[]): RandomGenerator {
		return new AleaRandomGenerator({ seeds });
	}

	insecure: RandomGenerator = this;
}
