// We use cryptographically strong PRNGs (window.crypto.getRandomValues())
// when available. If these PRNGs fail, we fall back to the Alea PRNG, which is 
// not cryptographically strong, and we seed it with various sources 
// such as the date, Math.random, and window size on the client.
// When using window.crypto.getRandomValues() or alea, the primitive is fraction 
// and we use that to construct hex string.

import BrowserRandomGenerator from './BrowserRandomGenerator';
import createAleaGeneratorWithGeneratedSeed from './createAleaGenerator';
import createRandom from './createRandom';

let generator;
if (typeof window !== 'undefined' && window.crypto &&
  window.crypto.getRandomValues) {
  generator = new BrowserRandomGenerator();
} else {
  // On IE 10 and below, there's no browser crypto API
  // available. Fall back to Alea
  //
  // XXX looks like at the moment, we use Alea in IE 11 as well,
  // which has `window.msCrypto` instead of `window.crypto`.
  generator = createAleaGeneratorWithGeneratedSeed();
}


export const Random = createRandom(generator);
