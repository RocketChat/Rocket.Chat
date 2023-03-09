import RandomGenerator from './AbstractRandomGenerator';

// cryptographically strong PRNGs available in modern browsers
export default class BrowserRandomGenerator extends RandomGenerator {
  /**
   * @name Random.fraction
   * @summary Return a number between 0 and 1, like `Math.random`.
   * @locus Anywhere
   */
  fraction () {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] * 2.3283064365386963e-10; // 2^-32
  }
}
