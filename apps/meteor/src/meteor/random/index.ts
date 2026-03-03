const UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
const BASE64_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

export type RandomGeneratorType = {
  fraction(): number;
  hexString(digits: number): string;
  id(charsCount?: number): string;
  secret(charsCount?: number): string;
  choice<T>(arrayOrString: T[] | string): T | string;
};

abstract class AbstractRandomGenerator implements RandomGeneratorType {
  abstract fraction(): number;

  hexString(digits: number): string {
    return this._randomString(digits, '0123456789abcdef');
  }

  protected _randomString(charsCount: number, alphabet: string): string {
    let result = '';
    for (let i = 0; i < charsCount; i++) {
      result += this.choice(alphabet) as string;
    }
    return result;
  }

  id(charsCount: number = 17): string {
    return this._randomString(charsCount, UNMISTAKABLE_CHARS);
  }

  secret(charsCount: number = 43): string {
    return this._randomString(charsCount, BASE64_CHARS);
  }

  choice<T>(arrayOrString: T[] | string): T | string {
    const index = Math.floor(this.fraction() * arrayOrString.length);
    if (typeof arrayOrString === 'string') {
      return arrayOrString.substring(index, index + 1);
    }
    return arrayOrString[index];
  }

  createWithSeeds = (...seeds: any[]) => {
    if (seeds.length === 0) {
      throw new Error('No seeds were provided');
    }
    return new AleaRandomGenerator({ seeds });
  };

  private _insecure?: AleaRandomGenerator;

  // FIX: Use a getter for lazy initialization to prevent infinite recursion
  get insecure(): AleaRandomGenerator {
    if (!this._insecure) {
      this._insecure = new AleaRandomGenerator({ seeds: [new Date()] });
    }
    return this._insecure;
  }
}

class BrowserRandomGenerator extends AbstractRandomGenerator {
  fraction(): number {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] * 2.3283064365386963e-10; // 2^-32
  }
}

// Alea PRNG, which is not cryptographically strong
function Mash(): (data: any) => number {
  let n = 0xefc8249d;

  const mash = (data: any): number => {
    const strData = data.toString();
    for (let i = 0; i < strData.length; i++) {
      n += strData.charCodeAt(i);
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

  (mash as any).version = 'Mash 0.9';
  return mash;
}

function Alea(seeds: any[]): any {
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let c = 1;

  if (seeds.length === 0) {
    seeds = [+new Date()];
  }

  let mash: any = Mash();
  s0 = mash(' ');
  s1 = mash(' ');
  s2 = mash(' ');

  for (let i = 0; i < seeds.length; i++) {
    s0 -= mash(seeds[i]);
    if (s0 < 0) s0 += 1;
    s1 -= mash(seeds[i]);
    if (s1 < 0) s1 += 1;
    s2 -= mash(seeds[i]);
    if (s2 < 0) s2 += 1;
  }
  mash = null;

  const random = () => {
    const t = (2091639 * s0) + (c * 2.3283064365386963e-10); // 2^-32
    s0 = s1;
    s1 = s2;
    return s2 = t - (c = t | 0);
  };

  random.uint32 = () => random() * 0x100000000; // 2^32
  random.fract53 = () => random() + ((random() * 0x200000 | 0) * 1.1102230246251565e-16); // 2^-53
  random.version = 'Alea 0.9';
  random.args = seeds;

  return random;
}

export class AleaRandomGenerator extends AbstractRandomGenerator {
  public alea: any;

  constructor(options: { seeds?: any[] } = {}) {
    super();
    const seeds = options.seeds || [];
    if (!seeds) {
      throw new Error('No seeds were provided for Alea PRNG');
    }
    this.alea = Alea(seeds);
  }

  fraction(): number {
    return this.alea();
  }
}

function createAleaGeneratorWithGeneratedSeed(): AleaRandomGenerator {
  const height = (typeof window !== 'undefined' && window.innerHeight) ||
    (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) ||
    (typeof document !== 'undefined' && document.body && document.body.clientHeight) ||
    1;

  const width = (typeof window !== 'undefined' && window.innerWidth) ||
    (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientWidth) ||
    (typeof document !== 'undefined' && document.body && document.body.clientWidth) ||
    1;

  const agent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';

  return new AleaRandomGenerator({
    seeds: [new Date(), height, width, agent, Math.random()],
  });
}

// --- Environment Initialization ---

let generator: AbstractRandomGenerator;

const hasBrowserCrypto = typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues;

if (hasBrowserCrypto) {
  generator = new BrowserRandomGenerator();
} else {
  // Fallback for older browsers (e.g., IE 10)
  generator = createAleaGeneratorWithGeneratedSeed();
}

// --- Public API ---

export type ExtendedRandomGenerator = RandomGeneratorType & {
  createWithSeeds(...seeds: any[]): AleaRandomGenerator;
  insecure: AleaRandomGenerator;
};

function createRandom(baseGenerator: AbstractRandomGenerator): ExtendedRandomGenerator {
  return baseGenerator as ExtendedRandomGenerator;
}

export const Random = createRandom(generator);